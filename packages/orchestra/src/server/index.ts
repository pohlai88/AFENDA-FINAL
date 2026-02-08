/**
 * Orchestra Kernel Server barrel export.
 * Zero domain knowledge — pure system infrastructure services.
 */

import type { Database } from "@afenda/shared/server/db";

// Re-export constants needed by API routes
export { KERNEL_ERROR_CODES, type KernelErrorCode } from "../constant/orchestra.system";

// Auth context (from @afenda/auth — Neon Auth session)
export {
  getAuthContext,
  getCurrentUserId,
  getCurrentUserName,
  isAuthenticated,
  type AuthContext,
} from "./auth-context";

// Service discovery
export {
  registerService,
  listServices,
  getService,
  unregisterService,
  updateServiceStatus,
  updateServiceMetadata,
  type DiscoveryServiceDeps,
} from "./orchestra.discovery";

// Health monitoring
export {
  checkAllServiceHealth,
  getHealthCheck,
  getDiagnostics,
  type HealthServiceDeps,
} from "./orchestra.health";

// Health history
export {
  recordHealthCheck,
  getHealthHistory,
  calculateUptime,
  type HealthHistoryServiceDeps,
  type RecordHealthCheckInput,
  type HealthHistoryEntry,
  type HealthHistoryQueryInput,
  type HealthHistoryResponse,
} from "./orchestra.health-history";

// Admin configuration
export {
  getConfig,
  setConfig,
  deleteConfig,
  listConfigs,
  bulkSetConfigs,
  type AdminConfigServiceDeps,
} from "./orchestra.admin-config";

// Backup/restore
export {
  triggerBackup,
  triggerRestore,
  type BackupServiceDeps,
  type BackupResult,
  type BackupResponse,
  type RestoreResponse,
} from "./orchestra.backup";

// Enhanced backup with encryption and storage
export {
  createEnhancedBackup,
  listBackups,
  getBackup,
  deleteBackup,
  restoreFromBackup,
  type EnhancedBackupServiceDeps,
  type CreateBackupOptions,
} from "./orchestra.backup-enhanced";

// Backup schedules (cron-based automation)
export {
  listBackupSchedules,
  createBackupSchedule,
  updateBackupSchedule,
  deleteBackupSchedule,
  type BackupScheduleServiceDeps,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from "./orchestra.backup-schedule";

// Backup encryption
export {
  getOrGenerateEncryptionKey,
  encryptBackup,
  decryptBackup,
  validateEncryptionKey,
  getEncryptionInfo,
  type EncryptionServiceDeps,
} from "./orchestra.backup-encryption";

// Backup storage
export {
  storeBackup,
  retrieveBackup,
  deleteBackup as deleteBackupFromStorage,
  isR2Configured,
  getStorageInfo,
  type StorageMetadata,
} from "./orchestra.backup-storage";

// Neon backup
export {
  triggerNeonBackup,
  getNeonBackupStatus,
  exportNeonDatabase,
  isNeonConfigured,
  getNeonInfo,
} from "./orchestra.backup-neon";

// Audit logging
export {
  logAudit,
  queryAuditLogs,
  type AuditServiceDeps,
  type LogAuditInput,
  type AuditLogEntry,
  type AuditQueryInput,
  type AuditQueryResponse,
} from "./orchestra.audit";

// Navigation (BFF aggregation)
export {
  getNavTree,
  getShellHealth,
  type NavServiceDeps,
} from "./orchestra.nav";

// App domains registry (sidebar: fetch available domains)
export {
  getAvailableDomains,
  type AppDomainsDeps,
} from "./orchestra.domains";

// Configuration templates
export {
  listTemplates,
  getTemplate,
  getTemplatesByCategoryName,
  getPreset,
  validateTemplateValues,
  applyTemplate,
  applyPreset,
  type ConfigTemplateDeps,
} from "./orchestra.config-template";

// Custom template service
export * from "./orchestra.custom-template";

/**
 * Complete kernel database deps type (union of all service deps)
 * Use this when creating a db instance that works with all services.
 */
export type KernelDbDeps = {
  db: Database;
};

