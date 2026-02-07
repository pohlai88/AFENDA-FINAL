/**
 * Orchestra Kernel Backup Schema
 * Database schema for backup metadata and history.
 *
 * @domain orchestra
 * @layer drizzle
 */

import { pgTable, uuid, text, bigint, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";

/**
 * Backup metadata table
 * Stores information about all backups (Neon DB, R2 bucket, service data)
 */
export const orchestraBackups = pgTable(
  "orchestra_backups",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    filename: text("filename").notNull(),
    storageLocation: text("storage_location").notNull(), // R2 key, S3 path, local path
    storageProvider: text("storage_provider").notNull(), // 'r2', 's3', 'gcs', 'local'
    backupType: text("backup_type").notNull(), // 'full', 'incremental', 'differential'
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    checksum: text("checksum").notNull(), // SHA-256 hash
    status: text("status").notNull(), // 'in-progress', 'completed', 'failed'
    
    // Encryption metadata
    encrypted: boolean("encrypted").default(true).notNull(),
    encryptionAlgorithm: text("encryption_algorithm").default("aes-256-gcm"),
    encryptionKeyVersion: text("encryption_key_version").default("1"),
    
    // Backup contents
    includesDatabase: boolean("includes_database").default(true),
    includesR2Bucket: boolean("includes_r2_bucket").default(false),
    includesServices: jsonb("includes_services").$type<string[]>(), // Array of service IDs
    
    // Fallback storage
    localFallbackPath: text("local_fallback_path"), // Local copy path for R2 backups
    
    // Audit fields
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    
    // Retention
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    
    // Additional metadata
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    
    // Error tracking
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details").$type<Record<string, unknown>>(),
  },
  (t) => [
    index("orchestra_backups_status_idx").on(t.status),
    index("orchestra_backups_created_at_idx").on(t.createdAt),
    index("orchestra_backups_created_by_idx").on(t.createdBy),
    index("orchestra_backups_storage_provider_idx").on(t.storageProvider),
    index("orchestra_backups_backup_type_idx").on(t.backupType),
  ]
);

/**
 * Backup history table
 * Tracks all backup operations and state changes
 */
export const orchestraBackupHistory = pgTable(
  "orchestra_backup_history",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    backupId: uuid("backup_id").notNull().references(() => orchestraBackups.id, { onDelete: "cascade" }),
    
    // Event tracking
    eventType: text("event_type").notNull(), // 'started', 'completed', 'failed', 'deleted', 'restored'
    eventMessage: text("event_message"),
    eventDetails: jsonb("event_details").$type<Record<string, unknown>>(),
    
    // Audit
    actorId: text("actor_id"),
    traceId: text("trace_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("orchestra_backup_history_backup_id_idx").on(t.backupId),
    index("orchestra_backup_history_event_type_idx").on(t.eventType),
    index("orchestra_backup_history_created_at_idx").on(t.createdAt),
  ]
);

// Type exports
export type BackupRow = typeof orchestraBackups.$inferSelect;
export type BackupInsert = typeof orchestraBackups.$inferInsert;
export type BackupHistoryRow = typeof orchestraBackupHistory.$inferSelect;
export type BackupHistoryInsert = typeof orchestraBackupHistory.$inferInsert;
