/**
 * Orchestra Kernel Database Schema
 * Tables: service_registry, admin_config, audit_log
 *
 * Zero domain knowledge — pure system infrastructure tables.
 * NO tenancy columns — these are global system tables.
 *
 * @see .dev-note/multi-tenancy-schema.md
 */

import { pgTable, text, timestamp, jsonb, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { timestamps, createdAtOnly, idx } from "@afenda/shared/drizzle/manifest";

/**
 * Service Registry Table
 * Stores registered services with their endpoints and health status.
 */
export const orchestraServiceRegistry = pgTable(
  "orchestra_service_registry",
  {
    id: text("id").primaryKey().notNull(),
    endpoint: text("endpoint").notNull(),
    healthCheck: text("health_check").notNull(),
    description: text("description"),
    version: text("version"),
    tags: jsonb("tags").$type<string[]>(),
    status: text("status").notNull().default("registered"),
    lastHealthCheck: timestamp("last_health_check", { withTimezone: true, mode: "date" }),
    lastHealthLatencyMs: integer("last_health_latency_ms"),
    lastHealthError: text("last_health_error"),
    // Service metadata
    ownerContact: text("owner_contact"),
    documentationUrl: text("documentation_url"),
    // Health check configuration
    healthCheckIntervalMs: integer("health_check_interval_ms").default(30000),
    healthCheckTimeoutMs: integer("health_check_timeout_ms").default(5000),
    // Timestamps
    registeredAt: timestamp("registered_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    ...timestamps(),
  },
  (t) => [
    idx("orchestra_service_registry", "status").on(t.status),
    idx("orchestra_service_registry", "updated_at").on(t.updatedAt),
  ]
);

export type ServiceRegistryRow = typeof orchestraServiceRegistry.$inferSelect;
export type ServiceRegistryInsert = typeof orchestraServiceRegistry.$inferInsert;

/**
 * Admin Config Table
 * Generic key-value configuration store for tenant/app-wide settings.
 */
export const orchestraAdminConfig = pgTable(
  "orchestra_admin_config",
  {
    key: text("key").primaryKey().notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    updatedBy: text("updated_by"),
    ...timestamps(),
  },
  (t) => [
    idx("orchestra_admin_config", "updated_at").on(t.updatedAt),
  ]
);

export type AdminConfigRow = typeof orchestraAdminConfig.$inferSelect;
export type AdminConfigInsert = typeof orchestraAdminConfig.$inferInsert;

/**
 * Audit Event Types
 */
export const AUDIT_EVENT_TYPES = {
  SERVICE_REGISTERED: "service.registered",
  SERVICE_UNREGISTERED: "service.unregistered",
  SERVICE_HEALTH_CHANGED: "service.health_changed",
  SERVICE_UPDATED: "service.updated",
  CONFIG_SET: "config.set",
  CONFIG_CREATED: "config.created",
  CONFIG_UPDATED: "config.updated",
  CONFIG_DELETED: "config.deleted",
  BACKUP_STARTED: "backup.started",
  BACKUP_COMPLETED: "backup.completed",
  BACKUP_FAILED: "backup.failed",
  RESTORE_STARTED: "restore.started",
  RESTORE_COMPLETED: "restore.completed",
  RESTORE_FAILED: "restore.failed",
} as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[keyof typeof AUDIT_EVENT_TYPES];

/**
 * Audit Log Table
 * System-level audit trail for kernel operations.
 */
export const orchestraAuditLog = pgTable(
  "orchestra_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    actorId: text("actor_id"),
    actorType: text("actor_type").default("system"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    previousValues: jsonb("previous_values").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    traceId: text("trace_id"),
    ...createdAtOnly(),
  },
  (t) => [
    idx("orchestra_audit_log", "event_type").on(t.eventType),
    idx("orchestra_audit_log", "entity_type", "entity_id").on(t.entityType, t.entityId),
    idx("orchestra_audit_log", "actor_id").on(t.actorId),
    idx("orchestra_audit_log", "created_at").on(t.createdAt),
    idx("orchestra_audit_log", "trace_id").on(t.traceId),
  ]
);

export type AuditLogRow = typeof orchestraAuditLog.$inferSelect;
export type AuditLogInsert = typeof orchestraAuditLog.$inferInsert;

/**
 * Config History Table
 * Tracks all configuration changes for diff viewer and audit trail.
 */
export const orchestraConfigHistory = pgTable(
  "orchestra_config_history",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    configKey: text("config_key").notNull(),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    changedBy: text("changed_by"),
    changedAt: timestamp("changed_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    idx("orchestra_config_history", "config_key").on(t.configKey),
    idx("orchestra_config_history", "changed_at").on(t.changedAt),
    idx("orchestra_config_history", "changed_by").on(t.changedBy),
  ]
);

export type ConfigHistoryRow = typeof orchestraConfigHistory.$inferSelect;
export type ConfigHistoryInsert = typeof orchestraConfigHistory.$inferInsert;

/**
 * Health History Table
 * Time-series health check data for monitoring and analytics.
 */
export const orchestraHealthHistory = pgTable(
  "orchestra_health_history",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    serviceId: text("service_id").notNull(),
    status: text("status").notNull(),
    latencyMs: integer("latency_ms"),
    errorMessage: text("error_message"),
    recordedAt: timestamp("recorded_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    idx("orchestra_health_history", "service_id").on(t.serviceId),
    idx("orchestra_health_history", "recorded_at").on(t.recordedAt),
    idx("orchestra_health_history", "status").on(t.status),
    idx("orchestra_health_history", "service_id", "recorded_at").on(t.serviceId, t.recordedAt),
  ]
);

export type HealthHistoryRow = typeof orchestraHealthHistory.$inferSelect;
export type HealthHistoryInsert = typeof orchestraHealthHistory.$inferInsert;

/**
 * Backup Schedule Table
 * Automated backup schedules with cron expressions.
 */
export const orchestraBackupSchedule = pgTable(
  "orchestra_backup_schedule",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    cronExpression: text("cron_expression").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    backupType: text("backup_type").notNull().default("full"),
    retentionDays: integer("retention_days").notNull().default(30),
    lastRun: timestamp("last_run", { withTimezone: true, mode: "date" }),
    nextRun: timestamp("next_run", { withTimezone: true, mode: "date" }),
    createdBy: text("created_by"),
    ...timestamps(),
  },
  (t) => [
    idx("orchestra_backup_schedule", "enabled").on(t.enabled),
    idx("orchestra_backup_schedule", "next_run").on(t.nextRun),
    idx("orchestra_backup_schedule", "created_by").on(t.createdBy),
  ]
);

export type BackupScheduleRow = typeof orchestraBackupSchedule.$inferSelect;
export type BackupScheduleInsert = typeof orchestraBackupSchedule.$inferInsert;

/**
 * App Domains Registry
 * Lists available product domains (apps) for the shell sidebar.
 * Fetched server-side like the service registry; sidebar shows what is available.
 */
export const orchestraAppDomains = pgTable(
  "orchestra_app_domains",
  {
    id: text("id").primaryKey().notNull(),
    label: text("label").notNull(),
    href: text("href").notNull(),
    icon: text("icon").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    description: text("description"),
    ...timestamps(),
  },
  (t) => [
    idx("orchestra_app_domains", "enabled").on(t.enabled),
    idx("orchestra_app_domains", "sort_order").on(t.sortOrder),
  ]
);

export type AppDomainRow = typeof orchestraAppDomains.$inferSelect;
export type AppDomainInsert = typeof orchestraAppDomains.$inferInsert;

// Note: config-templates.schema and orchestra.backup.schema are re-exported
// from drizzle/index.ts — NOT here, to avoid duplicate symbol re-exports.
