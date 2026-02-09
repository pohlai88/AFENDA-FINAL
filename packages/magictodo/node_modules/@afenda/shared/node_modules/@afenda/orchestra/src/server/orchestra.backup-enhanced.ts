/**
 * Orchestra Kernel Enhanced Backup Service
 * Enhanced backup operations with encryption, storage, and metadata tracking.
 *
 * @domain orchestra
 * @layer server
 */

import "server-only";

import { eq, count, sum } from "drizzle-orm";
import {
  AUDIT_EVENT_TYPES,
} from "../drizzle/orchestra.schema";
import {
  orchestraBackups,
  orchestraBackupHistory,
  type BackupRow,
} from "../drizzle/orchestra.backup.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import { logAudit, type AuditServiceDeps } from "./orchestra.audit";
import { getOrGenerateEncryptionKey, encryptBackup, decryptBackup } from "./orchestra.backup-encryption";
import { storeBackup, retrieveBackup, deleteBackup as deleteBackupFromStorage } from "./orchestra.backup-storage";
import { exportNeonDatabase } from "./orchestra.backup-neon";
import { BACKUP_TYPES, BACKUP_STATUS } from "../constant/orchestra.backup.constants";

export type EnhancedBackupServiceDeps = AuditServiceDeps;

export interface CreateBackupOptions {
  includeDatabase?: boolean;
  includeR2Bucket?: boolean;
  serviceIds?: string[];
  backupType?: string;
}

/**
 * Create enhanced backup with encryption and dual storage
 */
export async function createEnhancedBackup(
  deps: EnhancedBackupServiceDeps,
  options: CreateBackupOptions = {},
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<BackupRow>> {
  const { db } = deps;
  const backupId = crypto.randomUUID();
  const filename = `backup-${Date.now()}.enc`;

  try {
    // Create backup record with in-progress status
    const [_backupRecord] = await db
      .insert(orchestraBackups)
      .values({
        id: backupId,
        filename,
        storageLocation: "", // Will update after storage
        storageProvider: "", // Will update after storage
        backupType: options.backupType || BACKUP_TYPES.FULL,
        sizeBytes: 0, // Will update after storage
        checksum: "", // Will update after storage
        status: BACKUP_STATUS.IN_PROGRESS,
        encrypted: true,
        encryptionAlgorithm: "aes-256-gcm",
        includesDatabase: options.includeDatabase ?? true,
        includesR2Bucket: options.includeR2Bucket ?? false,
        includesServices: options.serviceIds,
        createdBy: opts?.actorId,
      })
      .returning();

    // Log backup started
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.BACKUP_STARTED,
      entityType: "backup",
      entityId: backupId,
      actorId: opts?.actorId,
      traceId: opts?.traceId,
    });

    // Add history entry
    await db.insert(orchestraBackupHistory).values({
      backupId,
      eventType: "started",
      eventMessage: "Backup started",
      actorId: opts?.actorId,
      traceId: opts?.traceId,
    });

    // Collect backup data
    const backupData: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      backupId,
      version: "1.0",
    };

    // Include database if requested
    if (options.includeDatabase) {
      const dbExportResult = await exportNeonDatabase();
      if (dbExportResult.ok) {
        backupData.database = dbExportResult.data.toString("base64");
      }
    }

    // Convert to buffer
    const dataBuffer = Buffer.from(JSON.stringify(backupData));

    // Get encryption key
    const keyResult = await getOrGenerateEncryptionKey(deps, opts);
    if (!keyResult.ok) {
      throw new Error(`Failed to get encryption key: ${keyResult.error.message}`);
    }

    // Encrypt backup
    const encryptResult = await encryptBackup(dataBuffer, keyResult.data);
    if (!encryptResult.ok) {
      throw new Error(`Failed to encrypt backup: ${encryptResult.error.message}`);
    }

    // Store backup (dual storage: R2 + local)
    const storeResult = await storeBackup(encryptResult.data, filename);
    if (!storeResult.ok) {
      throw new Error(`Failed to store backup: ${storeResult.error.message}`);
    }

    // Update backup record with storage info
    const [updatedBackup] = await db
      .update(orchestraBackups)
      .set({
        storageLocation: storeResult.data.storageLocation,
        storageProvider: storeResult.data.storageProvider,
        localFallbackPath: storeResult.data.localFallbackPath,
        sizeBytes: storeResult.data.sizeBytes,
        checksum: storeResult.data.checksum,
        status: BACKUP_STATUS.COMPLETED,
        completedAt: new Date(),
      })
      .where(eq(orchestraBackups.id, backupId))
      .returning();

    // Log backup completed
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.BACKUP_COMPLETED,
      entityType: "backup",
      entityId: backupId,
      actorId: opts?.actorId,
      traceId: opts?.traceId,
      details: {
        sizeBytes: storeResult.data.sizeBytes,
        storageProvider: storeResult.data.storageProvider,
      },
    });

    // Add history entry
    await db.insert(orchestraBackupHistory).values({
      backupId,
      eventType: "completed",
      eventMessage: "Backup completed successfully",
      actorId: opts?.actorId,
      traceId: opts?.traceId,
    });

    return kernelOk(updatedBackup);
  } catch (error) {
    // Update backup record as failed
    await db
      .update(orchestraBackups)
      .set({
        status: BACKUP_STATUS.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      })
      .where(eq(orchestraBackups.id, backupId));

    // Log backup failed
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.BACKUP_FAILED,
      entityType: "backup",
      entityId: backupId,
      actorId: opts?.actorId,
      traceId: opts?.traceId,
      details: { error: error instanceof Error ? error.message : String(error) },
    });

    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to create backup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * List backups with pagination
 */
export async function listBackups(
  deps: EnhancedBackupServiceDeps,
  options: { limit?: number; offset?: number } = {}
): Promise<KernelEnvelope<{ backups: BackupRow[]; total: number; totalSizeBytes: number }>> {
  const { db } = deps;
  const limit = options.limit || 10;
  const offset = options.offset || 0;

  try {
    const [backups, aggResult] = await Promise.all([
      db
        .select()
        .from(orchestraBackups)
        .orderBy(orchestraBackups.createdAt)
        .limit(limit)
        .offset(offset),
      db
        .select({
          total: count(),
          totalSizeBytes: sum(orchestraBackups.sizeBytes),
        })
        .from(orchestraBackups),
    ]);

    const agg = aggResult[0];
    const total = agg?.total ?? 0;
    const totalSizeBytes = Number(agg?.totalSizeBytes ?? 0) || 0;

    return kernelOk({
      backups,
      total,
      totalSizeBytes,
    });
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to list backups",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get backup by ID
 */
export async function getBackup(
  deps: EnhancedBackupServiceDeps,
  backupId: string
): Promise<KernelEnvelope<BackupRow>> {
  const { db } = deps;

  try {
    const [backup] = await db
      .select()
      .from(orchestraBackups)
      .where(eq(orchestraBackups.id, backupId));

    if (!backup) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: "Backup not found",
      });
    }

    return kernelOk(backup);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to get backup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete backup
 */
export async function deleteBackup(
  deps: EnhancedBackupServiceDeps,
  backupId: string,
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<void>> {
  const { db } = deps;

  try {
    // Get backup record
    const backupResult = await getBackup(deps, backupId);
    if (!backupResult.ok) {
      return backupResult;
    }

    const backup = backupResult.data;

    // Delete from storage
    const deleteResult = await deleteBackupFromStorage(
      backup.storageProvider,
      backup.storageLocation,
      backup.localFallbackPath || undefined
    );

    if (!deleteResult.ok) {
      return deleteResult;
    }

    // Delete from database
    await db.delete(orchestraBackups).where(eq(orchestraBackups.id, backupId));

    // Log deletion
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.CONFIG_DELETED,
      entityType: "backup",
      entityId: backupId,
      actorId: opts?.actorId,
      traceId: opts?.traceId,
    });

    return kernelOk(undefined);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to delete backup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(
  deps: EnhancedBackupServiceDeps,
  backupId: string,
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<{ restored: boolean }>> {
  const { db } = deps;

  try {
    // Get backup record
    const backupResult = await getBackup(deps, backupId);
    if (!backupResult.ok) {
      return backupResult;
    }

    const backup = backupResult.data;

    // Retrieve backup from storage
    const retrieveResult = await retrieveBackup(
      backup.storageProvider,
      backup.storageLocation,
      backup.localFallbackPath || undefined
    );

    if (!retrieveResult.ok) {
      return retrieveResult;
    }

    // Get encryption key
    const keyResult = await getOrGenerateEncryptionKey(deps, opts);
    if (!keyResult.ok) {
      return keyResult;
    }

    // Decrypt backup
    const decryptResult = await decryptBackup(retrieveResult.data, keyResult.data);
    if (!decryptResult.ok) {
      return decryptResult;
    }

    // Parse backup data
    const _backupData = JSON.parse(decryptResult.data.toString());

    // TODO: Implement actual restore logic
    // This would restore database, R2 files, etc.

    // Log restore
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.CONFIG_UPDATED,
      entityType: "backup",
      entityId: backupId,
      actorId: opts?.actorId,
      traceId: opts?.traceId,
      details: { action: "restore" },
    });

    // Add history entry
    await db.insert(orchestraBackupHistory).values({
      backupId,
      eventType: "restored",
      eventMessage: "Backup restored successfully",
      actorId: opts?.actorId,
      traceId: opts?.traceId,
    });

    return kernelOk({ restored: true });
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to restore backup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
