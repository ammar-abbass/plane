"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { issues, issueLabels, comments, activityLog, projects } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireWorkspaceMember } from "@/lib/auth";
import { PlaneError } from "@/lib/errors";
import { tryCatch } from "@/lib/result";
import { broadcastIssueUpdate } from "@/lib/realtime";
import type { Result, IssueStatus, IssuePriority, ActivityAction } from "@/types";

const MAX_ISSUE_TITLE_LENGTH = 255;

const createIssueSchema = z.object({
  workspaceSlug: z.string().min(1),
  projectId: z.string().uuid(),
  title: z.string().min(1).max(MAX_ISSUE_TITLE_LENGTH),
  description: z.string().max(5000).nullish(),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]).optional(),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).optional(),
  assigneeId: z.string().min(1).optional(),
  dueDate: z.string().date().optional(),
}).catchall(z.never());

const updateIssueSchema = z.object({
  issueId: z.string().uuid(),
  workspaceSlug: z.string().min(1),
  title: z.string().min(1).max(MAX_ISSUE_TITLE_LENGTH).optional(),
  description: z.string().max(5000).nullish(),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]).optional(),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).optional(),
  assigneeId: z.string().min(1).optional().nullable(),
  dueDate: z.string().date().optional().nullable(),
}).catchall(z.never());

const deleteIssueSchema = z.object({
  issueId: z.string().uuid(),
  workspaceSlug: z.string().min(1),
}).catchall(z.never());

const addLabelSchema = z.object({
  issueId: z.string().uuid(),
  labelId: z.string().uuid(),
  workspaceSlug: z.string().min(1),
}).catchall(z.never());

const removeLabelSchema = z.object({
  issueId: z.string().uuid(),
  labelId: z.string().uuid(),
  workspaceSlug: z.string().min(1),
}).catchall(z.never());

const addCommentSchema = z.object({
  issueId: z.string().uuid(),
  workspaceSlug: z.string().min(1),
  body: z.string().min(1).max(5000),
}).catchall(z.never());

const updateCommentSchema = z.object({
  commentId: z.string().uuid(),
  workspaceSlug: z.string().min(1),
  body: z.string().min(1).max(5000),
}).catchall(z.never());

const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
  workspaceSlug: z.string().min(1),
}).catchall(z.never());

async function recordActivity(
  tx: typeof db,
  params: {
    workspaceId: string;
    issueId: string;
    actorId: string;
    action: ActivityAction;
    fromValue?: string | null;
    toValue?: string | null;
  },
) {
  await tx.insert(activityLog).values({
    workspaceId: params.workspaceId,
    issueId: params.issueId,
    actorId: params.actorId,
    action: params.action,
    fromValue: params.fromValue ?? null,
    toValue: params.toValue ?? null,
  });
}

export async function createIssue(input: unknown): Promise<Result<{ id: string; sequenceId: number; title: string }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = createIssueSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [project] = await db
      .select({ id: projects.id, workspaceId: projects.workspaceId })
      .from(projects)
      .where(eq(projects.id, parsed.projectId))
      .limit(1);

    if (!project || project.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Project not found.", 404);
    }

    const result = await db.transaction(async (tx) => {
      const [{ nextSeq }] = await tx
        .select({ nextSeq: sql<number>`COALESCE(MAX(${issues.sequenceId}), 0) + 1` })
        .from(issues)
        .where(eq(issues.projectId, parsed.projectId));

      const [issue] = await tx
        .insert(issues)
        .values({
          workspaceId: member.workspaceId,
          projectId: parsed.projectId,
          sequenceId: nextSeq,
          title: parsed.title,
          description: parsed.description ?? null,
          status: parsed.status ?? "backlog",
          priority: parsed.priority ?? "none",
          assigneeId: parsed.assigneeId ?? null,
          dueDate: parsed.dueDate ?? null,
          createdBy: userId,
        })
        .returning({ id: issues.id, sequenceId: issues.sequenceId, title: issues.title });

      await recordActivity(tx, {
        workspaceId: member.workspaceId,
        issueId: issue.id,
        actorId: userId,
        action: "issue.created",
        toValue: parsed.title,
      });

      return issue;
    });

    await broadcastIssueUpdate(parsed.workspaceSlug, {
      type: "issue.created",
      issueId: result.id,
      projectId: parsed.projectId,
      workspaceSlug: parsed.workspaceSlug,
      changes: { 
        title: result.title, 
        sequenceId: result.sequenceId,
        status: parsed.status ?? "backlog", 
        priority: parsed.priority ?? "none",
        assigneeId: parsed.assigneeId ?? null,
        dueDate: parsed.dueDate ?? null,
        labels: [],
      },
      actorId: userId,
      timestamp: new Date().toISOString(),
    });

    return result;
  });
}

export async function updateIssue(input: unknown): Promise<Result<{ id: string; title: string }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = updateIssueSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [issue] = await db
      .select({
        id: issues.id,
        workspaceId: issues.workspaceId,
        projectId: issues.projectId,
        title: issues.title,
        description: issues.description,
        status: issues.status,
        priority: issues.priority,
        assigneeId: issues.assigneeId,
        dueDate: issues.dueDate,
      })
      .from(issues)
      .where(eq(issues.id, parsed.issueId))
      .limit(1);

    if (!issue || issue.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Issue not found.", 404);
    }

    const result = await db.transaction(async (tx) => {
      const updates: Record<string, unknown> = {};
      if (parsed.title !== undefined) updates.title = parsed.title;
      if (parsed.description !== undefined) updates.description = parsed.description;
      if (parsed.status !== undefined) updates.status = parsed.status;
      if (parsed.priority !== undefined) updates.priority = parsed.priority;
      if (parsed.assigneeId !== undefined) updates.assigneeId = parsed.assigneeId;
      if (parsed.dueDate !== undefined) updates.dueDate = parsed.dueDate;
      updates.updatedAt = new Date();

      const [updated] = await tx
        .update(issues)
        .set(updates)
        .where(eq(issues.id, parsed.issueId))
        .returning({ id: issues.id, title: issues.title });

      if (parsed.status !== undefined && parsed.status !== issue.status) {
        await recordActivity(tx, {
          workspaceId: member.workspaceId,
          issueId: issue.id,
          actorId: userId,
          action: "issue.status_changed",
          fromValue: issue.status,
          toValue: parsed.status,
        });
      }

      if (parsed.priority !== undefined && parsed.priority !== issue.priority) {
        await recordActivity(tx, {
          workspaceId: member.workspaceId,
          issueId: issue.id,
          actorId: userId,
          action: "issue.priority_changed",
          fromValue: issue.priority,
          toValue: parsed.priority,
        });
      }

      if (parsed.assigneeId !== undefined && parsed.assigneeId !== issue.assigneeId) {
        await recordActivity(tx, {
          workspaceId: member.workspaceId,
          issueId: issue.id,
          actorId: userId,
          action: "issue.assignee_changed",
          fromValue: issue.assigneeId,
          toValue: parsed.assigneeId,
        });
      }

      if (parsed.title !== undefined && parsed.title !== issue.title) {
        await recordActivity(tx, {
          workspaceId: member.workspaceId,
          issueId: issue.id,
          actorId: userId,
          action: "issue.title_changed",
          fromValue: issue.title,
          toValue: parsed.title,
        });
      }

      if (parsed.dueDate !== undefined && parsed.dueDate !== issue.dueDate) {
        await recordActivity(tx, {
          workspaceId: member.workspaceId,
          issueId: issue.id,
          actorId: userId,
          action: "issue.due_date_changed",
          fromValue: issue.dueDate,
          toValue: parsed.dueDate,
        });
      }

      return updated;
    });

    await broadcastIssueUpdate(parsed.workspaceSlug, {
      type: "issue.updated",
      issueId: result.id,
      projectId: issue.projectId,
      workspaceSlug: parsed.workspaceSlug,
      changes: {
        title: parsed.title ?? issue.title,
        status: parsed.status ?? (issue.status as IssueStatus),
        priority: parsed.priority ?? (issue.priority as IssuePriority),
        assigneeId: parsed.assigneeId ?? issue.assigneeId,
        dueDate: parsed.dueDate ?? issue.dueDate,
      },
      actorId: userId,
      timestamp: new Date().toISOString(),
    });

    return result;
  });
}

export async function deleteIssue(input: unknown): Promise<Result<void>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = deleteIssueSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [issue] = await db
      .select({ id: issues.id, workspaceId: issues.workspaceId, projectId: issues.projectId })
      .from(issues)
      .where(eq(issues.id, parsed.issueId))
      .limit(1);

    if (!issue || issue.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Issue not found.", 404);
    }

    await db.delete(issues).where(eq(issues.id, parsed.issueId));

    await broadcastIssueUpdate(parsed.workspaceSlug, {
      type: "issue.deleted",
      issueId: issue.id,
      projectId: issue.projectId,
      workspaceSlug: parsed.workspaceSlug,
      changes: {},
      actorId: userId,
      timestamp: new Date().toISOString(),
    });
  });
}

export async function addLabel(input: unknown): Promise<Result<void>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = addLabelSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [issue] = await db
      .select({ id: issues.id, workspaceId: issues.workspaceId })
      .from(issues)
      .where(eq(issues.id, parsed.issueId))
      .limit(1);

    if (!issue || issue.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Issue not found.", 404);
    }

    await db.insert(issueLabels).values({ issueId: parsed.issueId, labelId: parsed.labelId }).onConflictDoNothing();

    await db.transaction(async (tx) => {
      await recordActivity(tx, {
        workspaceId: member.workspaceId,
        issueId: issue.id,
        actorId: userId,
        action: "label.added",
        toValue: parsed.labelId,
      });
    });
  });
}

export async function removeLabel(input: unknown): Promise<Result<void>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = removeLabelSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [issue] = await db
      .select({ id: issues.id, workspaceId: issues.workspaceId })
      .from(issues)
      .where(eq(issues.id, parsed.issueId))
      .limit(1);

    if (!issue || issue.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Issue not found.", 404);
    }

    await db
      .delete(issueLabels)
      .where(and(eq(issueLabels.issueId, parsed.issueId), eq(issueLabels.labelId, parsed.labelId)));

    await db.transaction(async (tx) => {
      await recordActivity(tx, {
        workspaceId: member.workspaceId,
        issueId: issue.id,
        actorId: userId,
        action: "label.removed",
        fromValue: parsed.labelId,
      });
    });
  });
}

export async function addComment(input: unknown): Promise<Result<{ id: string; body: string }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = addCommentSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [issue] = await db
      .select({ id: issues.id, workspaceId: issues.workspaceId })
      .from(issues)
      .where(eq(issues.id, parsed.issueId))
      .limit(1);

    if (!issue || issue.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Issue not found.", 404);
    }

    const result = await db.transaction(async (tx) => {
      const [comment] = await tx
        .insert(comments)
        .values({ issueId: parsed.issueId, authorId: userId, body: parsed.body })
        .returning({ id: comments.id, body: comments.body });

      await recordActivity(tx, {
        workspaceId: member.workspaceId,
        issueId: issue.id,
        actorId: userId,
        action: "comment.added",
        toValue: parsed.body,
      });

      return comment;
    });

    return result;
  });
}

export async function updateComment(input: unknown): Promise<Result<{ id: string; body: string }>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = updateCommentSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [comment] = await db
      .select({ id: comments.id, authorId: comments.authorId, issueId: comments.issueId })
      .from(comments)
      .where(eq(comments.id, parsed.commentId))
      .limit(1);

    if (!comment) throw new PlaneError("NOT_FOUND", "Comment not found.", 404);
    if (comment.authorId !== userId) throw new PlaneError("FORBIDDEN", "Can only edit your own comments.", 403);

    const [issue] = await db
      .select({ workspaceId: issues.workspaceId })
      .from(issues)
      .where(eq(issues.id, comment.issueId))
      .limit(1);

    if (!issue || issue.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Issue not found.", 404);
    }

    const [updated] = await db
      .update(comments)
      .set({ body: parsed.body, updatedAt: new Date() })
      .where(eq(comments.id, parsed.commentId))
      .returning({ id: comments.id, body: comments.body });

    return updated;
  });
}

export async function deleteComment(input: unknown): Promise<Result<void>> {
  return tryCatch(async () => {
    const { userId } = await auth();
    if (!userId) throw new PlaneError("UNAUTHENTICATED", "Not signed in.", 401);

    const parsed = deleteCommentSchema.parse(input);
    const member = await requireWorkspaceMember(parsed.workspaceSlug, userId, "member");

    const [comment] = await db
      .select({ id: comments.id, authorId: comments.authorId, issueId: comments.issueId })
      .from(comments)
      .where(eq(comments.id, parsed.commentId))
      .limit(1);

    if (!comment) throw new PlaneError("NOT_FOUND", "Comment not found.", 404);
    if (comment.authorId !== userId) throw new PlaneError("FORBIDDEN", "Can only delete your own comments.", 403);

    const [issue] = await db
      .select({ workspaceId: issues.workspaceId })
      .from(issues)
      .where(eq(issues.id, comment.issueId))
      .limit(1);

    if (!issue || issue.workspaceId !== member.workspaceId) {
      throw new PlaneError("NOT_FOUND", "Issue not found.", 404);
    }

    await db.transaction(async (tx) => {
      await tx.delete(comments).where(eq(comments.id, parsed.commentId));
      await recordActivity(tx, {
        workspaceId: member.workspaceId,
        issueId: comment.issueId,
        actorId: userId,
        action: "comment.deleted",
        fromValue: parsed.commentId,
      });
    });
  });
}
