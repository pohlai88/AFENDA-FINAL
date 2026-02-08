/**
 * Orchestra Kernel Admin Config Service
 * Generic key-value configuration store.
 *
 * Zero domain knowledge — stores any config, doesn't validate semantics.
 */

import "server-only";

import { eq, ilike } from "drizzle-orm";
import type { Database } from "@afenda/shared/server/db";

import {
  orchestraAdminConfig,
  orchestraConfigHistory,
  type AdminConfigInsert,
  type AdminConfigRow,
  type ConfigHistoryInsert,
  AUDIT_EVENT_TYPES,
} from "../drizzle/orchestra.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import {
  type ConfigEntry,
  type SetConfigInput,
  type ConfigListResponse,
  type BulkSetConfigInput,
} from "../zod/orchestra.admin-config.schema";
import { logAudit } from "./orchestra.audit";

export type AdminConfigServiceDeps = {
  db: Database;
};


/** Convert DB row to API entry */
function rowToConfigEntry(row: AdminConfigRow): ConfigEntry {
  return {
    key: row.key,
    value: row.value,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

/**
 * Get a single config value by key.
 */
export async function getConfig(
  deps: AdminConfigServiceDeps,
  key: string,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<ConfigEntry>> {
  const { db } = deps;

  try {
    const [row] = await db
      .select()
      .from(orchestraAdminConfig)
      .where(eq(orchestraAdminConfig.key, key));

    if (!row) {
      return kernelFail(
        {
          code: KERNEL_ERROR_CODES.NOT_FOUND,
          message: `Config key '${key}' not found`,
        },
        { traceId: opts?.traceId }
      );
    }

    return kernelOk(rowToConfigEntry(row), { traceId: opts?.traceId });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to get config",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Set a config value (upsert).
 */
export async function setConfig(
  deps: AdminConfigServiceDeps,
  input: SetConfigInput,
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<ConfigEntry>> {
  const { db } = deps;

  try {
    // Check if exists for audit
    const [existing] = await db
      .select()
      .from(orchestraAdminConfig)
      .where(eq(orchestraAdminConfig.key, input.key));

    const now = new Date();
    const values: AdminConfigInsert = {
      key: input.key,
      value: input.value,
      description: input.description ?? null,
      updatedAt: now,
      updatedBy: opts?.actorId ?? null,
      ...(existing ? {} : { createdAt: now }),
    };

    const [result] = await db
      .insert(orchestraAdminConfig)
      .values(values)
      .onConflictDoUpdate({
        target: orchestraAdminConfig.key,
        set: {
          value: input.value,
          description: input.description ?? null,
          updatedAt: now,
          updatedBy: opts?.actorId ?? null,
        },
      })
      .returning();

    // Record config history for changes (not for new configs)
    if (existing) {
      const historyEntry: ConfigHistoryInsert = {
        configKey: input.key,
        oldValue: existing.value,
        newValue: input.value,
        changedBy: opts?.actorId ?? null,
        changedAt: now,
      };

      await db.insert(orchestraConfigHistory).values(historyEntry);
    }

    // Audit log
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.CONFIG_SET,
      entityType: "config",
      entityId: input.key,
      actorId: opts?.actorId,
      actorType: opts?.actorId ? "user" : "system",
      details: { value: input.value },
      previousValues: existing ? { value: existing.value } : undefined,
      traceId: opts?.traceId,
    });

    return kernelOk(rowToConfigEntry(result), {
      message: existing ? `Config '${input.key}' updated` : `Config '${input.key}' created`,
      traceId: opts?.traceId,
    });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to set config",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Delete a config value.
 */
export async function deleteConfig(
  deps: AdminConfigServiceDeps,
  key: string,
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<{ key: string }>> {
  const { db } = deps;

  try {
    const [existing] = await db
      .select()
      .from(orchestraAdminConfig)
      .where(eq(orchestraAdminConfig.key, key));

    if (!existing) {
      return kernelFail(
        {
          code: KERNEL_ERROR_CODES.NOT_FOUND,
          message: `Config key '${key}' not found`,
        },
        { traceId: opts?.traceId }
      );
    }

    await db
      .delete(orchestraAdminConfig)
      .where(eq(orchestraAdminConfig.key, key));

    // Audit log
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.CONFIG_DELETED,
      entityType: "config",
      entityId: key,
      actorId: opts?.actorId,
      actorType: opts?.actorId ? "user" : "system",
      previousValues: { value: existing.value },
      traceId: opts?.traceId,
    });

    return kernelOk(
      { key },
      {
        message: `Config '${key}' deleted`,
        traceId: opts?.traceId,
      }
    );
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to delete config",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * List all config entries with optional prefix filtering.
 */
export async function listConfigs(
  deps: AdminConfigServiceDeps,
  opts?: { prefix?: string; traceId?: string }
): Promise<KernelEnvelope<ConfigListResponse>> {
  const { db } = deps;

  try {
    const baseQuery = db.select().from(orchestraAdminConfig);

    const rows = opts?.prefix
      ? await baseQuery.where(ilike(orchestraAdminConfig.key, `${opts.prefix}%`)).orderBy(orchestraAdminConfig.key)
      : await baseQuery.orderBy(orchestraAdminConfig.key);

    const configs = rows.map(rowToConfigEntry);

    return kernelOk(
      { configs, total: configs.length },
      { traceId: opts?.traceId }
    );
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to list configs",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Bulk set multiple config values.
 */
export async function bulkSetConfigs(
  deps: AdminConfigServiceDeps,
  input: BulkSetConfigInput,
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<{ processed: number; failed: string[] }>> {
  const failed: string[] = [];
  let processed = 0;

  for (const entry of input.entries) {
    const result = await setConfig(deps, entry, opts);
    if (result.ok) {
      processed++;
    } else {
      failed.push(entry.key);
    }
  }

  return kernelOk(
    { processed, failed },
    {
      message: `Processed ${processed}/${input.entries.length} configs`,
      traceId: opts?.traceId,
    }
  );
}
