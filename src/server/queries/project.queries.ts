import { db } from "@/server/db";
import { projects, labels } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function getProjectsByWorkspace(workspaceId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      description: projects.description,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(projects.createdAt);
}

export async function getProjectById(projectId: string) {
  const [project] = await db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      name: projects.name,
      slug: projects.slug,
      description: projects.description,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return project ?? null;
}

export async function getLabelsByProject(projectId: string) {
  return db
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
      createdAt: labels.createdAt,
    })
    .from(labels)
    .where(eq(labels.projectId, projectId))
    .orderBy(labels.name);
}
