"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { workspaces, workspaceMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceMember, hasMinimumRole } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { PlaneError } from "@/lib/errors";
import { tryCatch } from "@/lib/result";
import type { Result, WorkspaceRole } from "@/types";

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
}).catchall(z.never());

const updateWorkspaceSchema = z.object({
  workspaceSlug: z.string().min(1),
  name: z.string().min(1).max(100),
}).catchall(z.never());

const inviteMemberSchema = z.object({
  workspaceSlug: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["admin", "member", "viewer"]),
}).catchall(z.never());

const updateMemberRoleSchema = z.object({
  workspaceSlug: z.string().min(1),
  memberId: z.string().uuid(),
  role: z.enum(["admin", "member", "viewer"]),
}).catchall(z.never());

const removeMemberSchema = z.object({
  workspaceSlug: z.string().min(1),
  memberId: z.string().uuid(),
}).catchall(z.never());

export async function createWorkspace(input: unknown): Promise<Result<{ id: string; name: string; slug: string }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = createWorkspaceSchema.parse(input);
    const slug = slugify(parsed.name);
    if (!slug) throw new PlaneError("VALIDATION_ERROR", "Invalid workspace name.", 400);

    const existing = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    if (existing.length > 0) throw new PlaneError("CONFLICT", "Workspace slug already taken.", 409);

    const [workspace] = await db
      .insert(workspaces)
      .values({ name: parsed.name, slug, ownerId: userId })
      .returning({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug });

    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: "owner",
    });

    return workspace;
  });
}

export async function updateWorkspace(input: unknown): Promise<Result<{ id: string; name: string; slug: string }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = updateWorkspaceSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "admin");

    const [updated] = await db
      .update(workspaces)
      .set({ name: parsed.name, updatedAt: new Date() })
      .where(eq(workspaces.id, member.workspaceId))
      .returning({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug });

    return updated;
  });
}

export async function deleteWorkspace(workspaceSlug: string): Promise<Result<void>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const member = await requireWorkspaceMember(workspaceSlug, userId, "owner");
    await db.delete(workspaces).where(eq(workspaces.id, member.workspaceId));
  });
}

export async function inviteMember(input: unknown): Promise<Result<{ id: string; userId: string; role: WorkspaceRole }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = inviteMemberSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "admin");

    const existing = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, member.workspaceId), eq(workspaceMembers.userId, parsed.userId)),
      )
      .limit(1);

    if (existing.length > 0) throw new PlaneError("CONFLICT", "User is already a member.", 409);

    const [newMember] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId: member.workspaceId,
        userId: parsed.userId,
        role: parsed.role,
        invitedBy: userId,
      })
      .returning({ id: workspaceMembers.id, userId: workspaceMembers.userId, role: workspaceMembers.role });

    return { ...newMember, role: newMember.role as WorkspaceRole };
  });
}

export async function updateMemberRole(input: unknown): Promise<Result<{ id: string; role: WorkspaceRole }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = updateMemberRoleSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "admin");

    const [target] = await db
      .select({ id: workspaceMembers.id, role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.id, parsed.memberId))
      .limit(1);

    if (!target) throw new PlaneError("NOT_FOUND", "Member not found.", 404);
    if (target.role === "owner") throw new PlaneError("FORBIDDEN", "Cannot change owner role.", 403);

    const [updated] = await db
      .update(workspaceMembers)
      .set({ role: parsed.role })
      .where(eq(workspaceMembers.id, parsed.memberId))
      .returning({ id: workspaceMembers.id, role: workspaceMembers.role });

    return { ...updated, role: updated.role as WorkspaceRole };
  });
}

export async function removeMember(input: unknown): Promise<Result<void>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = removeMemberSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "admin");

    const [target] = await db
      .select({ id: workspaceMembers.id, role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.id, parsed.memberId))
      .limit(1);

    if (!target) throw new PlaneError("NOT_FOUND", "Member not found.", 404);
    if (target.role === "owner") throw new PlaneError("FORBIDDEN", "Cannot remove owner.", 403);

    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, parsed.memberId));
  });
}
