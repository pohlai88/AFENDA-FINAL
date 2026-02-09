/**
 * @layer domain (orchestra)
 * @responsibility Drizzle ORM relation definitions for Orchestra kernel tables.
 *
 * Enables the relational query API:
 * ```ts
 * db.query.orchestraAuditLog.findMany({ with: { comments: true } })
 * ```
 */

import { relations } from "drizzle-orm";
import {
  orchestraServiceRegistry,
  orchestraAdminConfig as _orchestraAdminConfig,
  orchestraAuditLog,
  orchestraConfigHistory as _orchestraConfigHistory,
  orchestraHealthHistory,
  orchestraBackupSchedule as _orchestraBackupSchedule,
  orchestraAppDomains as _orchestraAppDomains,
} from "./orchestra.schema";
import { orchestraBackups, orchestraBackupHistory } from "./orchestra.backup.schema";
import { auditLogComments } from "./audit-comments.schema";
import { orchestraCustomTemplates as _orchestraCustomTemplates } from "./config-templates.schema";

// ─── Service Registry ────────────────────────────────────────────────
export const orchestraServiceRegistryRelations = relations(
  orchestraServiceRegistry,
  ({ many }) => ({
    healthHistory: many(orchestraHealthHistory),
  })
);

// ─── Health History ──────────────────────────────────────────────────
export const orchestraHealthHistoryRelations = relations(
  orchestraHealthHistory,
  ({ one }) => ({
    service: one(orchestraServiceRegistry, {
      fields: [orchestraHealthHistory.serviceId],
      references: [orchestraServiceRegistry.id],
    }),
  })
);

// ─── Audit Log ───────────────────────────────────────────────────────
export const orchestraAuditLogRelations = relations(
  orchestraAuditLog,
  ({ many }) => ({
    comments: many(auditLogComments),
  })
);

// ─── Audit Log Comments ──────────────────────────────────────────────
export const auditLogCommentsRelations = relations(
  auditLogComments,
  ({ one }) => ({
    auditLog: one(orchestraAuditLog, {
      fields: [auditLogComments.auditLogId],
      references: [orchestraAuditLog.id],
    }),
  })
);

// ─── Backups ─────────────────────────────────────────────────────────
export const orchestraBackupsRelations = relations(
  orchestraBackups,
  ({ many }) => ({
    history: many(orchestraBackupHistory),
  })
);

export const orchestraBackupHistoryRelations = relations(
  orchestraBackupHistory,
  ({ one }) => ({
    backup: one(orchestraBackups, {
      fields: [orchestraBackupHistory.backupId],
      references: [orchestraBackups.id],
    }),
  })
);

// ─── Tables with no FK relations (leaf nodes) ───────────────────────
// orchestraAdminConfig, orchestraConfigHistory, orchestraBackupSchedule,
// orchestraAppDomains, orchestraCustomTemplates — standalone tables.
// Explicit empty relations are not required by Drizzle ORM.
