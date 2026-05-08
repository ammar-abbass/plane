import { pgTable, text, timestamp, uuid, integer, date, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { projects } from "./projects";

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    sequenceId: integer("sequence_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", {
      enum: ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"],
    })
      .notNull()
      .default("backlog"),
    priority: text("priority", {
      enum: ["urgent", "high", "medium", "low", "none"],
    })
      .notNull()
      .default("none"),
    assigneeId: text("assignee_id"),
    dueDate: date("due_date"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("issues_project_status_idx").on(table.projectId, table.status),
    index("issues_project_assignee_idx").on(table.projectId, table.assigneeId),
    index("issues_project_created_idx").on(table.projectId, table.createdAt),
    index("issues_workspace_created_idx").on(table.workspaceId, table.createdAt),
    index("issues_project_sequence_idx").on(table.projectId, table.sequenceId),
  ],
);
