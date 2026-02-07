import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { orchestraAuditLog } from "./orchestra.schema";

/**
 * Audit Log Comments Table
 * User comments on audit events for context and collaboration
 */
export const auditLogComments = pgTable(
  "audit_log_comments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    auditLogId: uuid("audit_log_id")
      .notNull()
      .references(() => orchestraAuditLog.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_log_comments_log_idx").on(t.auditLogId),
    index("audit_log_comments_user_idx").on(t.userId),
    index("audit_log_comments_created_idx").on(t.createdAt),
  ]
);

export type AuditLogCommentRow = typeof auditLogComments.$inferSelect;
export type AuditLogCommentInsert = typeof auditLogComments.$inferInsert;
