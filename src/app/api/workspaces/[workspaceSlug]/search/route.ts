import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { issues } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireWorkspaceMember } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

const searchParamsSchema = z
  .object({
    q: z.string().min(1).max(100),
    projectId: z.string().uuid().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
  })
  .strict();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Not signed in." } },
      { status: 401 },
    );
  }

  const { workspaceSlug } = await params;

  try {
    const member = await requireWorkspaceMember(workspaceSlug, userId);

    const { searchParams } = new URL(request.url);
    const parseResult = searchParamsSchema.safeParse({
      q: searchParams.get("q"),
      projectId: searchParams.get("projectId") ?? undefined,
      limit: searchParams.get("limit") ?? "20",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid search parameters." } },
        { status: 400 },
      );
    }

    const { q, projectId, limit } = parseResult.data;

    const tsQuery = sql`plainto_tsquery('english', ${q})`;
    const tsVector = sql`to_tsvector('english', ${issues.title} || ' ' || COALESCE(${issues.description}, ''))`;
    const ftsCondition = sql`${tsVector} @@ ${tsQuery}`;

    const whereClause = projectId
      ? and(eq(issues.workspaceId, member.workspaceId), eq(issues.projectId, projectId), ftsCondition)
      : and(eq(issues.workspaceId, member.workspaceId), ftsCondition);

    const results = await db
      .select({
        id: issues.id,
        title: issues.title,
        description: issues.description,
        status: issues.status,
        priority: issues.priority,
        sequenceId: issues.sequenceId,
        projectId: issues.projectId,
      })
      .from(issues)
      .where(whereClause)
      .orderBy(sql`ts_rank(${tsVector}, ${tsQuery}) DESC`)
      .limit(limit);

    return NextResponse.json({ results });
  } catch (err) {
    logger.error({ err, workspaceSlug }, "Search error");
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Search failed." } },
      { status: 500 },
    );
  }
}
