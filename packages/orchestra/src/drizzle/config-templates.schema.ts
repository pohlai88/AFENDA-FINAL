/**
 * Orchestra Config Templates Database Schema
 * Custom templates with draft/archive support.
 *
 * Zero domain knowledge — generic template storage.
 */

import { index, pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";

/**
 * Custom Config Templates Table
 * User-created templates with draft and archive support.
 */
export const orchestraCustomTemplates = pgTable(
  "orchestra_custom_templates",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(), // System, Tenant, Service, Compliance
    icon: text("icon").notNull().default("IconSettings"),
    configs: jsonb("configs").notNull().$type<Array<{
      key: string;
      value: unknown;
      description: string;
      required: boolean;
      validation: Record<string, unknown>;
    }>>(),
    
    // Template metadata
    status: text("status").notNull().default("draft"), // draft, published, archived
    version: text("version").default("1.0.0"),
    tags: jsonb("tags").$type<string[]>(),
    
    // Ownership and audit
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    archivedBy: text("archived_by"),
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    
    // Usage tracking
    appliedCount: text("applied_count").default("0"), // Using text to avoid integer overflow
    lastAppliedAt: timestamp("last_applied_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    index("orchestra_custom_templates_status_idx").on(t.status),
    index("orchestra_custom_templates_category_idx").on(t.category),
    index("orchestra_custom_templates_created_by_idx").on(t.createdBy),
    index("orchestra_custom_templates_updated_idx").on(t.updatedAt),
    index("orchestra_custom_templates_name_idx").on(t.name),
  ]
);

export type CustomTemplateRow = typeof orchestraCustomTemplates.$inferSelect;
export type CustomTemplateInsert = typeof orchestraCustomTemplates.$inferInsert;

/**
 * Template Version History Table
 * Track all changes to custom templates for audit and rollback.
 */
export const orchestraTemplateHistory = pgTable(
  "orchestra_template_history",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    templateId: uuid("template_id").notNull(),
    version: text("version").notNull(),
    snapshot: jsonb("snapshot").notNull().$type<CustomTemplateRow>(),
    changeType: text("change_type").notNull(), // created, updated, published, archived, restored
    changedBy: text("changed_by"),
    changeNotes: text("change_notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("orchestra_template_history_template_idx").on(t.templateId),
    index("orchestra_template_history_created_idx").on(t.createdAt),
    index("orchestra_template_history_changed_by_idx").on(t.changedBy),
  ]
);

export type TemplateHistoryRow = typeof orchestraTemplateHistory.$inferSelect;
export type TemplateHistoryInsert = typeof orchestraTemplateHistory.$inferInsert;
