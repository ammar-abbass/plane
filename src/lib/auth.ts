import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { workspaces, workspaceMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { PlaneError } from "./errors";
import type { WorkspaceRole } from "@/types";

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function hasMinimumRole(actual: WorkspaceRole, required: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[actual] >= ROLE_HIERARCHY[required];
}

export async function requireWorkspaceMember(
  workspaceSlug: string,
  userId: string,
  minimumRole?: WorkspaceRole,
) {
  const [workspace] = await db
    .select({ id: workspaces.id, slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.slug, workspaceSlug))
    .limit(1);

  if (!workspace) {
    throw new PlaneError("NOT_FOUND", "Workspace not found.", 404);
  }

  const [membership] = await db
    .select({
      id: workspaceMembers.id,
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, workspace.id), eq(workspaceMembers.userId, userId)),
    )
    .limit(1);

  if (!membership) {
    throw new PlaneError("FORBIDDEN", "You do not have access to this workspace.", 403);
  }

  if (minimumRole && !hasMinimumRole(membership.role as WorkspaceRole, minimumRole)) {
    throw new PlaneError("FORBIDDEN", "You do not have permission to perform this action.", 403);
  }

  return { ...membership, role: membership.role as WorkspaceRole };
}
