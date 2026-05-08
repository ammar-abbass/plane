import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { issues } from "./issues";

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    issueId: uuid("issue_id")
      .references(() => issues.id, { onDelete: "cascade" })
      .notNull(),
    actorId: text("actor_id").notNull(),
    action: text("action", {
      enum: [
        "issue.created",
        "issue.status_changed",
        "issue.priority_changed",
        "issue.assignee_changed",
        "issue.title_changed",
        "issue.due_date_changed",
        "label.added",
        "label.removed",
        "comment.added",
        "comment.deleted",
      ],
    }).notNull(),
    fromValue: text("from_value"),
    toValue: text("to_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activity_issue_created_idx").on(table.issueId, table.createdAt),
    index("activity_workspace_created_idx").on(table.workspaceId, table.createdAt),
  ],
);
