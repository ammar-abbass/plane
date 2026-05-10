"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { projects, labels } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceMember } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { PlaneError } from "@/lib/errors";
import { tryCatch } from "@/lib/result";
import type { Result } from "@/types";

const createProjectSchema = z.object({
  workspaceSlug: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
}).catchall(z.never());

const updateProjectSchema = z.object({
  projectId: z.uuid(),
  workspaceSlug: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
}).catchall(z.never());

const deleteProjectSchema = z.object({
  projectId: z.uuid(),
  workspaceSlug: z.string().min(1),
}).catchall(z.never());

const createLabelSchema = z.object({
  projectId: z.uuid(),
  workspaceSlug: z.string().min(1),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
}).catchall(z.never());

const deleteLabelSchema = z.object({
  labelId: z.uuid(),
  workspaceSlug: z.string().min(1),
}).catchall(z.never());

export async function createProject(input: unknown): Promise<Result<{ id: string; name: string; slug: string }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = createProjectSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "admin");

    const slug = slugify(parsed.name);
    if (!slug) throw new PlaneError("VALIDATION_ERROR", "Invalid project name.", 400);

    const existing = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.workspaceId, member.workspaceId), eq(projects.slug, slug)))
      .limit(1);

    if (existing.length > 0) throw new PlaneError("CONFLICT", "Project slug already taken in this workspace.", 409);

    const [project] = await db
      .insert(projects)
      .values({
        workspaceId: member.workspaceId,
        name: parsed.name,
        slug,
        description: parsed.description ?? null,
        createdBy: userId,
      })
      .returning({ id: projects.id, name: projects.name, slug: projects.slug });
    if (!project) throw new PlaneError("INTERNAL_ERROR", "Failed to create project.");

    return project;
  });
}

export async function updateProject(input: unknown): Promise<Result<{ id: string; name: string; slug: string }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = updateProjectSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "admin");

    const [project] = await db
      .select({ id: projects.id, workspaceId: projects.workspaceId })
      .from(projects)
      .where(eq(projects.id, parsed.projectId))
      .limit(1);

    if (!project || project.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Project not found.", 404);
    }

    const [updated] = await db
      .update(projects)
      .set({
        name: parsed.name ?? undefined,
        description: parsed.description ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, parsed.projectId))
      .returning({ id: projects.id, name: projects.name, slug: projects.slug });
    if (!updated) throw new PlaneError("INTERNAL_ERROR", "Failed to update project.");

    return updated;
  });
}

export async function deleteProject(input: unknown): Promise<Result<void>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = deleteProjectSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "admin");

    const [project] = await db
      .select({ id: projects.id, workspaceId: projects.workspaceId })
      .from(projects)
      .where(eq(projects.id, parsed.projectId))
      .limit(1);

    if (!project || project.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Project not found.", 404);
    }

    await db.delete(projects).where(eq(projects.id, parsed.projectId));
  });
}

export async function createLabel(input: unknown): Promise<Result<{ id: string; name: string; color: string }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = createLabelSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [project] = await db
      .select({ id: projects.id, workspaceId: projects.workspaceId })
      .from(projects)
      .where(eq(projects.id, parsed.projectId))
      .limit(1);

    if (!project || project.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Project not found.", 404);
    }

    const existing = await db
      .select({ id: labels.id })
      .from(labels)
      .where(and(eq(labels.projectId, parsed.projectId), eq(labels.name, parsed.name)))
      .limit(1);

    if (existing.length > 0) throw new PlaneError("CONFLICT", "Label already exists.", 409);

    const [label] = await db
      .insert(labels)
      .values({ projectId: parsed.projectId, name: parsed.name, color: parsed.color })
      .returning({ id: labels.id, name: labels.name, color: labels.color });
    if (!label) throw new PlaneError("INTERNAL_ERROR", "Failed to create label.");

    return label;
  });
}

export async function deleteLabel(input: unknown): Promise<Result<void>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = deleteLabelSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [label] = await db
      .select({ id: labels.id, projectId: labels.projectId })
      .from(labels)
      .where(eq(labels.id, parsed.labelId))
      .limit(1);

    if (!label) throw new PlaneError("NOT_FOUND", "Label not found.", 404);

    const [project] = await db
      .select({ workspaceId: projects.workspaceId })
      .from(projects)
      .where(eq(projects.id, label.projectId))
      .limit(1);

    if (!project || project.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Label not found.", 404);
    }

    await db.delete(labels).where(eq(labels.id, parsed.labelId));
  });
}
