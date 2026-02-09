/**
 * Orchestra Kernel Audit Service
 * System-level audit logging for kernel operations.
 *
 * Zero domain knowledge — logs events, doesn't interpret them.
 */

import "server-only";

import { desc, eq, and, gte, lte, sql, type SQL } from "drizzle-orm";
import type { Database } from "@afenda/shared/server/db";

import {
  orchestraAuditLog,
  type AuditLogInsert,
  type AuditLogRow,
  type AuditEventType,
} from "../drizzle/orchestra.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import { createKernelLogger } from "../pino/orchestra.pino";

const logger = createKernelLogger("audit");

export type AuditServiceDeps = {
  db: Database;
};

export type LogAuditInput = {
  eventType: AuditEventType | string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorType?: string;
  details?: Record<string, unknown>;
  previousValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
};

export type AuditLogEntry = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string | null;
  actorId: string | null;
  actorType: string | null;
  details: Record<string, unknown> | null;
  previousValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  traceId: string | null;
  createdAt: string;
};

export type AuditQueryInput = {
  eventType?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export type AuditQueryResponse = {
  entries: AuditLogEntry[];
  total: number;
  hasMore: boolean;
};

/** Convert DB row to API entry */
function rowToEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    eventType: row.eventType,
    entityType: row.entityType,
    entityId: row.entityId,
    actorId: row.actorId,
    actorType: row.actorType,
    details: row.details,
    previousValues: row.previousValues,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    traceId: row.traceId,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Log an audit event.
 */
export async function logAudit(
  deps: AuditServiceDeps,
  input: LogAuditInput
): Promise<KernelEnvelope<AuditLogEntry>> {
  const { db } = deps;

  try {
    const row: AuditLogInsert = {
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? "system",
      details: input.details ?? null,
      previousValues: input.previousValues ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      traceId: input.traceId ?? null,
    };

    const [inserted] = await db
      .insert(orchestraAuditLog)
      .values(row)
      .returning();

    return kernelOk(rowToEntry(inserted));
  } catch (error) {
    // Audit logging should not fail silently but also shouldn't crash
    logger.error({
      err: error instanceof Error ? error : undefined,
      message: error instanceof Error ? error.message : String(error),
    }, "Failed to log audit event");
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to log audit event",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Query audit logs with filtering.
 */
export async function queryAuditLogs(
  deps: AuditServiceDeps,
  input: AuditQueryInput,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<AuditQueryResponse>> {
  const { db } = deps;
  const limit = Math.min(input.limit ?? 50, 1000);
  const offset = input.offset ?? 0;

  try {
    // Build conditions
    const conditions: SQL[] = [];

    if (input.eventType) {
      conditions.push(eq(orchestraAuditLog.eventType, input.eventType));
    }
    if (input.entityType) {
      conditions.push(eq(orchestraAuditLog.entityType, input.entityType));
    }
    if (input.entityId) {
      conditions.push(eq(orchestraAuditLog.entityId, input.entityId));
    }
    if (input.actorId) {
      conditions.push(eq(orchestraAuditLog.actorId, input.actorId));
    }
    if (input.startDate) {
      conditions.push(gte(orchestraAuditLog.createdAt, new Date(input.startDate)));
    }
    if (input.endDate) {
      conditions.push(lte(orchestraAuditLog.createdAt, new Date(input.endDate)));
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orchestraAuditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult?.count ?? 0;

    // Get entries
    const rows = await db
      .select()
      .from(orchestraAuditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orchestraAuditLog.createdAt))
      .limit(limit)
      .offset(offset);

    const entries = rows.map(rowToEntry);
    const hasMore = offset + entries.length < total;

    return kernelOk(
      { entries, total, hasMore },
      { traceId: opts?.traceId }
    );
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to query audit logs",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}
