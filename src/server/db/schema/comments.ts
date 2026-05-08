import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { issues } from "./issues";

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  issueId: uuid("issue_id")
    .references(() => issues.id, { onDelete: "cascade" })
    .notNull(),
  authorId: text("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
