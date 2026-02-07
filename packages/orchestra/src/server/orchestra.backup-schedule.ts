/**
 * Orchestra Kernel - Backup Schedule Service
 * CRUD for automated backup schedules (cron-based).
 *
 * @domain orchestra
 * @layer server
 */

import "server-only";

import { eq, desc } from "drizzle-orm";
import {
  orchestraBackupSchedule,
  type BackupScheduleRow,
  type BackupScheduleInsert,
} from "../drizzle/orchestra.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import type { AuditServiceDeps } from "./orchestra.audit";

export type BackupScheduleServiceDeps = AuditServiceDeps;

export interface CreateScheduleInput {
  name: string;
  cronExpression: string;
  enabled?: boolean;
  backupType?: string;
  retentionDays?: number;
}

export interface UpdateScheduleInput {
  enabled?: boolean;
  name?: string;
  cronExpression?: string;
}

/**
 * List all backup schedules (for admin UI).
 */
export async function listBackupSchedules(
  deps: BackupScheduleServiceDeps
): Promise<KernelEnvelope<BackupScheduleRow[]>> {
  const { db } = deps;
  try {
    const schedules = await db
      .select()
      .from(orchestraBackupSchedule)
      .orderBy(desc(orchestraBackupSchedule.createdAt));
    return kernelOk(schedules);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to list backup schedules",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Create a backup schedule.
 */
export async function createBackupSchedule(
  deps: BackupScheduleServiceDeps,
  input: CreateScheduleInput,
  opts?: { actorId?: string }
): Promise<KernelEnvelope<BackupScheduleRow>> {
  const { db } = deps;
  try {
    const [row] = await db
      .insert(orchestraBackupSchedule)
      .values({
        name: input.name,
        cronExpression: input.cronExpression,
        enabled: input.enabled ?? true,
        backupType: input.backupType ?? "full",
        retentionDays: input.retentionDays ?? 30,
        createdBy: opts?.actorId ?? null,
      } as BackupScheduleInsert)
      .returning();
    if (!row) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to create backup schedule",
      });
    }
    return kernelOk(row);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to create backup schedule",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Update a backup schedule (e.g. enable/disable).
 */
export async function updateBackupSchedule(
  deps: BackupScheduleServiceDeps,
  scheduleId: string,
  input: UpdateScheduleInput
): Promise<KernelEnvelope<BackupScheduleRow>> {
  const { db } = deps;
  try {
    const [row] = await db
      .update(orchestraBackupSchedule)
      .set({
        ...(input.enabled !== undefined && { enabled: input.enabled }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.cronExpression !== undefined && { cronExpression: input.cronExpression }),
        updatedAt: new Date(),
      })
      .where(eq(orchestraBackupSchedule.id, scheduleId))
      .returning();
    if (!row) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: "Backup schedule not found",
      });
    }
    return kernelOk(row);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to update backup schedule",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete a backup schedule.
 */
export async function deleteBackupSchedule(
  deps: BackupScheduleServiceDeps,
  scheduleId: string
): Promise<KernelEnvelope<void>> {
  const { db } = deps;
  try {
    const result = await db
      .delete(orchestraBackupSchedule)
      .where(eq(orchestraBackupSchedule.id, scheduleId))
      .returning({ id: orchestraBackupSchedule.id });
    if (result.length === 0) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: "Backup schedule not found",
      });
    }
    return kernelOk(undefined);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to delete backup schedule",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
