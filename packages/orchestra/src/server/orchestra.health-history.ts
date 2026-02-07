/**
 * Orchestra Kernel Health History Service
 * Records and queries time-series health check data.
 *
 * Zero domain knowledge — stores health metrics, doesn't interpret them.
 */

import "server-only";

import { desc, eq, and, gte, sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import {
  orchestraHealthHistory,
  type HealthHistoryInsert,
  type HealthHistoryRow,
} from "../drizzle/orchestra.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import { kernelLogger } from "../constant/orchestra.logger";

export type HealthHistoryServiceDeps = {
  db: NeonHttpDatabase<Record<string, unknown>>;
};

export type RecordHealthCheckInput = {
  serviceId: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  errorMessage?: string;
};

export type HealthHistoryEntry = {
  id: string;
  serviceId: string;
  status: string;
  latencyMs: number | null;
  errorMessage: string | null;
  recordedAt: string;
};

export type HealthHistoryQueryInput = {
  serviceId?: string;
  hours?: number;
  limit?: number;
};

export type HealthHistoryResponse = {
  entries: HealthHistoryEntry[];
  total: number;
};

/** Convert DB row to API entry */
function rowToEntry(row: HealthHistoryRow): HealthHistoryEntry {
  return {
    id: row.id,
    serviceId: row.serviceId,
    status: row.status,
    latencyMs: row.latencyMs,
    errorMessage: row.errorMessage,
    recordedAt: row.recordedAt.toISOString(),
  };
}

/**
 * Record a health check result to history.
 */
export async function recordHealthCheck(
  deps: HealthHistoryServiceDeps,
  input: RecordHealthCheckInput,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<HealthHistoryEntry>> {
  const { db } = deps;

  try {
    const row: HealthHistoryInsert = {
      serviceId: input.serviceId,
      status: input.status,
      latencyMs: input.latencyMs,
      errorMessage: input.errorMessage ?? null,
      recordedAt: new Date(),
    };

    const [inserted] = await db
      .insert(orchestraHealthHistory)
      .values(row)
      .returning();

    return kernelOk(rowToEntry(inserted), { traceId: opts?.traceId });
  } catch (error) {
    kernelLogger.error("orchestra.health-history", "Failed to record health check", {
      error: error instanceof Error ? error.message : String(error),
    });
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to record health check",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Query health history with filtering.
 */
export async function getHealthHistory(
  deps: HealthHistoryServiceDeps,
  input: HealthHistoryQueryInput,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<HealthHistoryResponse>> {
  const { db } = deps;
  const limit = Math.min(input.limit ?? 100, 1000);
  const hours = input.hours ?? 24;

  try {
    // Build conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [];

    if (input.serviceId) {
      conditions.push(eq(orchestraHealthHistory.serviceId, input.serviceId));
    }

    // Time range filter (last N hours)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    conditions.push(gte(orchestraHealthHistory.recordedAt, cutoffTime));

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orchestraHealthHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult?.count ?? 0;

    // Get entries
    const rows = await db
      .select()
      .from(orchestraHealthHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orchestraHealthHistory.recordedAt))
      .limit(limit);

    const entries = rows.map(rowToEntry);

    return kernelOk(
      { entries, total },
      { traceId: opts?.traceId }
    );
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to query health history",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Calculate service uptime percentage from history.
 */
export async function calculateUptime(
  deps: HealthHistoryServiceDeps,
  serviceId: string,
  hours: number = 24,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<{ uptime: number; total: number; healthy: number }>> {
  const { db } = deps;

  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const [result] = await db
      .select({
        total: sql<number>`count(*)::int`,
        healthy: sql<number>`count(*) FILTER (WHERE status = 'healthy')::int`,
      })
      .from(orchestraHealthHistory)
      .where(
        and(
          eq(orchestraHealthHistory.serviceId, serviceId),
          gte(orchestraHealthHistory.recordedAt, cutoffTime)
        )
      );

    const total = result?.total ?? 0;
    const healthy = result?.healthy ?? 0;
    const uptime = total > 0 ? (healthy / total) * 100 : 0;

    return kernelOk(
      { uptime: Math.round(uptime * 100) / 100, total, healthy },
      { traceId: opts?.traceId }
    );
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to calculate uptime",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}
