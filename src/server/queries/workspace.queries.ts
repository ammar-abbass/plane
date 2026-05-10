import { db } from "@/server/db";
import { workspaces, workspaceMembers } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function getWorkspaceBySlug(slug: string) {
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      ownerId: workspaces.ownerId,
      createdAt: workspaces.createdAt,
    })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  return workspace ?? null;
}

export async function getUserWorkspaces(userId: string) {
  const rows = await db
    .select({
      workspace: {
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
      },
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(workspaces.createdAt);

  return rows;
}

export async function getWorkspaceMembers(workspaceId: string) {
  return db
    .select({
      id: workspaceMembers.id,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      invitedBy: workspaceMembers.invitedBy,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(workspaceMembers.joinedAt);
}
