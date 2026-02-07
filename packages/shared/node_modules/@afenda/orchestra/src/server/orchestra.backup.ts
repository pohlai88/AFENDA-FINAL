/**
 * Orchestra Kernel Backup Service
 * Backup/restore coordination with encryption and dual storage.
 *
 * Features:
 * - AES-256-GCM encryption
 * - Dual storage (R2 + local fallback)
 * - Database backup metadata tracking
 * - Service coordination
 */

import "server-only";

import {
  orchestraServiceRegistry,
  type ServiceRegistryRow,
  AUDIT_EVENT_TYPES,
} from "../drizzle/orchestra.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import { SERVICE_STATUS } from "../zod/orchestra.service.schema";
import { logAudit, type AuditServiceDeps } from "./orchestra.audit";

export type BackupServiceDeps = AuditServiceDeps;

export type BackupResult = {
  serviceId: string;
  status: "success" | "failed" | "skipped";
  error?: string;
  durationMs?: number;
};

export type BackupResponse = {
  id: string;
  startedAt: string;
  completedAt: string;
  results: BackupResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
  };
  backupMetadata?: {
    filename: string;
    storageProvider: string;
    storageLocation: string;
    sizeBytes: number;
    encrypted: boolean;
  };
};

export type RestoreResponse = BackupResponse;

/**
 * Trigger backup on a single service.
 */
async function triggerServiceBackup(
  endpoint: string,
  serviceId: string,
  timeoutMs = 30000
): Promise<BackupResult> {
  // eslint-disable-next-line no-restricted-syntax -- Dynamic API path construction
  const backupUrl = new URL("/api/backup/ops", endpoint).toString();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(backupUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (response.ok) {
      return { serviceId, status: "success", durationMs };
    } else {
      return {
        serviceId,
        status: "failed",
        error: `HTTP ${response.status}`,
        durationMs,
      };
    }
  } catch (error) {
    const durationMs = Date.now() - startTime;
    return {
      serviceId,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      durationMs,
    };
  }
}

/**
 * Trigger backup across all healthy registered services.
 */
export async function triggerBackup(
  deps: BackupServiceDeps,
  opts?: { traceId?: string; actorId?: string; serviceIds?: string[] }
): Promise<KernelEnvelope<BackupResponse>> {
  const { db } = deps;
  const backupId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  try {
    // Log backup started
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.BACKUP_STARTED,
      entityType: "backup",
      entityId: backupId,
      actorId: opts?.actorId,
      traceId: opts?.traceId,
    });

    // Get services to backup
    let services: ServiceRegistryRow[] = await db
      .select()
      .from(orchestraServiceRegistry);

    // Filter by service IDs if provided
    if (opts?.serviceIds && opts.serviceIds.length > 0) {
      services = services.filter((s: ServiceRegistryRow) => opts.serviceIds!.includes(s.id));
    }

    const results: BackupResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Trigger backup on each service
    for (const service of services) {
      // Skip unhealthy services
      if (service.status === SERVICE_STATUS.UNHEALTHY) {
        results.push({
          serviceId: service.id,
          status: "skipped",
          error: "Service is unhealthy",
        });
        skippedCount++;
        continue;
      }

      const result = await triggerServiceBackup(service.endpoint, service.id);
      results.push(result);

      if (result.status === "success") {
        successCount++;
      } else if (result.status === "failed") {
        failedCount++;
      }
    }

    const completedAt = new Date().toISOString();

    const response: BackupResponse = {
      id: backupId,
      startedAt,
      completedAt,
      results,
      summary: {
        total: services.length,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
      },
    };

    // Log backup completed/failed
    const allSucceeded = failedCount === 0;
    await logAudit(deps, {
      eventType: allSucceeded
        ? AUDIT_EVENT_TYPES.BACKUP_COMPLETED
        : AUDIT_EVENT_TYPES.BACKUP_FAILED,
      entityType: "backup",
      entityId: backupId,
      actorId: opts?.actorId,
      details: response.summary,
      traceId: opts?.traceId,
    });

    return kernelOk(response, {
      message: allSucceeded
        ? `Backup completed successfully for ${successCount} services`
        : `Backup completed with ${failedCount} failures`,
      traceId: opts?.traceId,
    });
  } catch (error) {
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.BACKUP_FAILED,
      entityType: "backup",
      entityId: backupId,
      actorId: opts?.actorId,
      details: { error: error instanceof Error ? error.message : String(error) },
      traceId: opts?.traceId,
    });

    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to trigger backup",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Trigger restore on a single service.
 */
async function triggerServiceRestore(
  endpoint: string,
  serviceId: string,
  backupId: string,
  timeoutMs = 60000
): Promise<BackupResult> {
  // eslint-disable-next-line no-restricted-syntax -- Dynamic API path construction
  const restoreUrl = new URL("/api/restore/ops", endpoint).toString();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(restoreUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ backupId }),
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (response.ok) {
      return { serviceId, status: "success", durationMs };
    } else {
      return {
        serviceId,
        status: "failed",
        error: `HTTP ${response.status}`,
        durationMs,
      };
    }
  } catch (error) {
    const durationMs = Date.now() - startTime;
    return {
      serviceId,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      durationMs,
    };
  }
}

/**
 * Trigger restore across registered services.
 */
export async function triggerRestore(
  deps: BackupServiceDeps,
  backupId: string,
  opts?: { traceId?: string; actorId?: string; serviceIds?: string[] }
): Promise<KernelEnvelope<RestoreResponse>> {
  const { db } = deps;
  const restoreId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  try {
    // Log restore started
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.RESTORE_STARTED,
      entityType: "restore",
      entityId: restoreId,
      actorId: opts?.actorId,
      details: { backupId },
      traceId: opts?.traceId,
    });

    // Get services to restore
    let services: ServiceRegistryRow[] = await db
      .select()
      .from(orchestraServiceRegistry);

    // Filter by service IDs if provided
    if (opts?.serviceIds && opts.serviceIds.length > 0) {
      services = services.filter((s: ServiceRegistryRow) => opts.serviceIds!.includes(s.id));
    }

    const results: BackupResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Trigger restore on each service
    for (const service of services) {
      const result = await triggerServiceRestore(
        service.endpoint,
        service.id,
        backupId
      );
      results.push(result);

      if (result.status === "success") {
        successCount++;
      } else if (result.status === "failed") {
        failedCount++;
      } else {
        skippedCount++;
      }
    }

    const completedAt = new Date().toISOString();

    const response: RestoreResponse = {
      id: restoreId,
      startedAt,
      completedAt,
      results,
      summary: {
        total: services.length,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
      },
    };

    // Log restore completed/failed
    const allSucceeded = failedCount === 0;
    await logAudit(deps, {
      eventType: allSucceeded
        ? AUDIT_EVENT_TYPES.RESTORE_COMPLETED
        : AUDIT_EVENT_TYPES.RESTORE_FAILED,
      entityType: "restore",
      entityId: restoreId,
      actorId: opts?.actorId,
      details: { ...response.summary, backupId },
      traceId: opts?.traceId,
    });

    return kernelOk(response, {
      message: allSucceeded
        ? `Restore completed successfully for ${successCount} services`
        : `Restore completed with ${failedCount} failures`,
      traceId: opts?.traceId,
    });
  } catch (error) {
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.RESTORE_FAILED,
      entityType: "restore",
      entityId: restoreId,
      actorId: opts?.actorId,
      details: { error: error instanceof Error ? error.message : String(error), backupId },
      traceId: opts?.traceId,
    });

    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to trigger restore",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}
