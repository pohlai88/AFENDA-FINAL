/**
 * Orchestra Kernel Backup Constants
 * Type-safe constants for backup operations.
 *
 * @domain orchestra
 * @layer constant
 */

export const BACKUP_TYPES = {
  FULL: "full",
  INCREMENTAL: "incremental",
  DIFFERENTIAL: "differential",
} as const;

export type BackupType = (typeof BACKUP_TYPES)[keyof typeof BACKUP_TYPES];

export const BACKUP_STATUS = {
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type BackupStatus = (typeof BACKUP_STATUS)[keyof typeof BACKUP_STATUS];

export const STORAGE_PROVIDERS = {
  R2: "r2",
  S3: "s3",
  GCS: "gcs",
  LOCAL: "local",
} as const;

export type StorageProvider = (typeof STORAGE_PROVIDERS)[keyof typeof STORAGE_PROVIDERS];

export const BACKUP_CONFIG = {
  DEFAULT_RETENTION_DAYS: 30,
  MAX_BACKUP_SIZE_GB: 100,
  BACKUP_TIMEOUT_MS: 300000, // 5 minutes
  ENCRYPTION_ALGORITHM: "aes-256-gcm",
  DEFAULT_BACKUP_TYPE: BACKUP_TYPES.FULL,
} as const;

export const BACKUP_FILE_EXTENSIONS = {
  ENCRYPTED: ".enc",
  BACKUP: ".backup",
  JSON: ".json",
  SQL: ".sql",
} as const;

export const BACKUP_STORAGE_PATHS = {
  LOCAL_DEFAULT: "./backups",
  R2_PREFIX: "backups/",
} as const;
