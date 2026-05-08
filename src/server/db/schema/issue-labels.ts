import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { issues } from "./issues";
import { labels } from "./labels";

export const issueLabels = pgTable(
  "issue_labels",
  {
    issueId: uuid("issue_id")
      .references(() => issues.id, { onDelete: "cascade" })
      .notNull(),
    labelId: uuid("label_id")
      .references(() => labels.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.issueId, table.labelId] })],
);
