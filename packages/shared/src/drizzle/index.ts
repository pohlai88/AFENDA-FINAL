/**
 * Database schema barrel export.
 * Aggregates all domain schemas for Drizzle.
 *
 * Pattern: Each domain defines schemas in packages/<domain>/src/drizzle/
 * This file re-exports them all for the shared db connection.
 *
 * @see drizzle.config.ts (points here for migrations)
 */

// Orchestra Kernel schemas
export {
  orchestraServiceRegistry,
  orchestraAdminConfig,
  orchestraAuditLog,
  orchestraConfigHistory,
  orchestraHealthHistory,
  orchestraBackupSchedule,
  AUDIT_EVENT_TYPES,
  type ServiceRegistryRow,
  type ServiceRegistryInsert,
  type AdminConfigRow,
  type AdminConfigInsert,
  type AuditLogRow,
  type AuditLogInsert,
  type ConfigHistoryRow,
  type ConfigHistoryInsert,
  type HealthHistoryRow,
  type HealthHistoryInsert,
  type BackupScheduleRow,
  type BackupScheduleInsert,
  type AuditEventType,
} from "@afenda/orchestra/drizzle";

// Add more domain schemas as they are created:
export * from "@afenda/magictodo/drizzle";
export * from "@afenda/magicdrive/drizzle";
export * from "@afenda/tenancy/drizzle";
