import { db } from "@/server/db";
import { issues, issueLabels, labels, comments, activityLog } from "@/server/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { IssueStatus, IssuePriority } from "@/types";

export async function getIssuesByProject(projectId: string) {
  return db
    .select({
      id: issues.id,
      sequenceId: issues.sequenceId,
      title: issues.title,
      description: issues.description,
      status: issues.status,
      priority: issues.priority,
      assigneeId: issues.assigneeId,
      dueDate: issues.dueDate,
      createdBy: issues.createdBy,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
    })
    .from(issues)
    .where(eq(issues.projectId, projectId))
    .orderBy(desc(issues.createdAt));
}

export async function getIssueById(issueId: string) {
  const [issue] = await db
    .select({
      id: issues.id,
      workspaceId: issues.workspaceId,
      projectId: issues.projectId,
      sequenceId: issues.sequenceId,
      title: issues.title,
      description: issues.description,
      status: issues.status,
      priority: issues.priority,
      assigneeId: issues.assigneeId,
      dueDate: issues.dueDate,
      createdBy: issues.createdBy,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
    })
    .from(issues)
    .where(eq(issues.id, issueId))
    .limit(1);

  return issue ?? null;
}

export async function getIssueLabels(issueId: string) {
  return db
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
    })
    .from(issueLabels)
    .innerJoin(labels, eq(issueLabels.labelId, labels.id))
    .where(eq(issueLabels.issueId, issueId));
}

export async function getIssueComments(issueId: string) {
  return db
    .select({
      id: comments.id,
      authorId: comments.authorId,
      body: comments.body,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })
    .from(comments)
    .where(eq(comments.issueId, issueId))
    .orderBy(desc(comments.createdAt));
}

export async function getIssueActivity(issueId: string) {
  return db
    .select({
      id: activityLog.id,
      actorId: activityLog.actorId,
      action: activityLog.action,
      fromValue: activityLog.fromValue,
      toValue: activityLog.toValue,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .where(eq(activityLog.issueId, issueId))
    .orderBy(desc(activityLog.createdAt));
}

export async function getIssuesWithLabels(projectId: string) {
  const issueRows = await getIssuesByProject(projectId);
  if (issueRows.length === 0) return [];

  const issueIds = issueRows.map((i) => i.id);
  const labelRows = await db
    .select({
      issueId: issueLabels.issueId,
      labelId: labels.id,
      labelName: labels.name,
      labelColor: labels.color,
    })
    .from(issueLabels)
    .innerJoin(labels, eq(issueLabels.labelId, labels.id))
    .where(inArray(issueLabels.issueId, issueIds));

  const labelsByIssue = new Map<string, { id: string; name: string; color: string }[]>();
  for (const row of labelRows) {
    const list = labelsByIssue.get(row.issueId) ?? [];
    list.push({ id: row.labelId, name: row.labelName, color: row.labelColor });
    labelsByIssue.set(row.issueId, list);
  }

  return issueRows.map((issue) => ({
    ...issue,
    labels: labelsByIssue.get(issue.id) ?? [],
  }));
}
