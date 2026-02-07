/**
 * magictodo snooze service (server-side business logic).
 */

import "server-only"

import { eq, and, lt, sql, asc } from "drizzle-orm"
import {
  magictodoSnoozedTasks,
  magictodoTasks,
  type DrizzleDB
} from "@afenda/magictodo/drizzle"
import { ok } from "@afenda/shared/server/response"

export const magictodoSnoozeServiceVersion = "0.1.0"

export class MagictodoSnoozeService {
  async initialize() {
    const readyAt = new Date().toISOString()
    return {
      ok: true,
      data: {
        status: "initialized",
        version: magictodoSnoozeServiceVersion,
        readyAt,
      },
    }
  }

  /**
   * Snooze a task until a specific date
   */
  async snoozeTask(
    userId: string,
    taskId: string,
    organizationId: string | null,
    teamId: string | null,
    input: {
      snoozedUntil: Date
      reason?: string
      dependencyTaskId?: string
    },
    db: DrizzleDB
  ) {
    // Verify task exists and belongs to user
    const taskConditions = [
      eq(magictodoTasks.id, taskId),
      eq(magictodoTasks.userId, userId),
    ]

    if (organizationId) {
      taskConditions.push(eq(magictodoTasks.organizationId, organizationId))
    }

    const [task] = await db
      .select({ id: magictodoTasks.id })
      .from(magictodoTasks)
      .where(and(...taskConditions))

    if (!task) {
      return {
        ok: false,
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found or doesn't belong to you",
        },
      }
    }

    // Check if already snoozed
    const [existing] = await db
      .select({ id: magictodoSnoozedTasks.id })
      .from(magictodoSnoozedTasks)
      .where(
        and(
          eq(magictodoSnoozedTasks.taskId, taskId),
          eq(magictodoSnoozedTasks.userId, userId)
        )
      )

    const snoozeId = crypto.randomUUID()
    const now = new Date()

    if (existing) {
      // Update existing snooze
      await db
        .update(magictodoSnoozedTasks)
        .set({
          snoozedUntil: input.snoozedUntil,
          reason: input.reason || null,
          dependencyTaskId: input.dependencyTaskId || null,
          snoozeCount: sql`${magictodoSnoozedTasks.snoozeCount} + 1`,
          updatedAt: now,
        })
        .where(eq(magictodoSnoozedTasks.id, existing.id))
    } else {
      // Create new snooze
      await db
        .insert(magictodoSnoozedTasks)
        .values({
          id: snoozeId,
          taskId,
          userId,
          snoozedUntil: input.snoozedUntil,
          reason: input.reason || null,
          snoozeCount: 1,
          dependencyTaskId: input.dependencyTaskId || null,
          createdAt: now,
          updatedAt: now,
          organizationId,
          teamId,
        })
    }

    return {
      ok: true,
      data: {
        taskId,
        snoozedUntil: input.snoozedUntil.toISOString(),
        reason: input.reason,
        dependencyTaskId: input.dependencyTaskId,
      },
    }
  }

  /**
   * Unsnooze a task
   */
  async unsnoozeTask(
    userId: string,
    taskId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoSnoozedTasks.taskId, taskId),
      eq(magictodoSnoozedTasks.userId, userId),
    ]

    if (organizationId) {
      conditions.push(eq(magictodoSnoozedTasks.organizationId, organizationId))
    }

    const result = await db
      .delete(magictodoSnoozedTasks)
      .where(and(...conditions))
      .returning()

    if (result.length === 0) {
      return {
        ok: false,
        error: {
          code: "NOT_SNOOZED",
          message: "Task is not snoozed",
        },
      }
    }

    return {
      ok: true,
      data: {
        taskId,
        unsnoozed: true,
      },
    }
  }

  /**
   * Get snoozed tasks for a user
   */
  async getSnoozedTasks(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    includeExpired: boolean = false,
    db: DrizzleDB
  ) {
    const conditions = [eq(magictodoSnoozedTasks.userId, userId)]

    if (organizationId) {
      conditions.push(eq(magictodoSnoozedTasks.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoSnoozedTasks.teamId, teamId))
    }

    if (!includeExpired) {
      conditions.push(sql`${magictodoSnoozedTasks.snoozedUntil} > NOW()`)
    }

    const snoozedTasks = await db
      .select({
        id: magictodoSnoozedTasks.id,
        taskId: magictodoSnoozedTasks.taskId,
        userId: magictodoSnoozedTasks.userId,
        snoozedUntil: magictodoSnoozedTasks.snoozedUntil,
        reason: magictodoSnoozedTasks.reason,
        snoozeCount: magictodoSnoozedTasks.snoozeCount,
        dependencyTaskId: magictodoSnoozedTasks.dependencyTaskId,
        createdAt: magictodoSnoozedTasks.createdAt,
        updatedAt: magictodoSnoozedTasks.updatedAt,
        // Task details
        taskTitle: magictodoTasks.title,
        taskDescription: magictodoTasks.description,
        taskPriority: magictodoTasks.priority,
        taskDueDate: magictodoTasks.dueDate,
        taskProjectId: magictodoTasks.projectId,
      })
      .from(magictodoSnoozedTasks)
      .leftJoin(magictodoTasks, eq(magictodoSnoozedTasks.taskId, magictodoTasks.id))
      .where(and(...conditions))
      .orderBy(asc(magictodoSnoozedTasks.snoozedUntil))

    return {
      ok: true,
      data: {
        items: snoozedTasks.map(st => ({
          ...st,
          snoozedUntil: st.snoozedUntil.toISOString(),
          createdAt: st.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: st.updatedAt?.toISOString() ?? new Date().toISOString(),
          taskDueDate: st.taskDueDate?.toISOString(),
        })),
        total: snoozedTasks.length,
      },
    }
  }

  /**
   * Get tasks that should be unsnoozed (snooze time has passed)
   */
  async getExpiredSnoozes(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoSnoozedTasks.userId, userId),
      lt(magictodoSnoozedTasks.snoozedUntil, new Date()),
    ]

    if (organizationId) {
      conditions.push(eq(magictodoSnoozedTasks.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoSnoozedTasks.teamId, teamId))
    }

    const expiredTasks = await db
      .select({
        id: magictodoSnoozedTasks.id,
        taskId: magictodoSnoozedTasks.taskId,
        snoozedUntil: magictodoSnoozedTasks.snoozedUntil,
        reason: magictodoSnoozedTasks.reason,
        snoozeCount: magictodoSnoozedTasks.snoozeCount,
        dependencyTaskId: magictodoSnoozedTasks.dependencyTaskId,
        taskTitle: magictodoTasks.title,
        taskPriority: magictodoTasks.priority,
      })
      .from(magictodoSnoozedTasks)
      .leftJoin(magictodoTasks, eq(magictodoSnoozedTasks.taskId, magictodoTasks.id))
      .where(and(...conditions))

    return {
      ok: true,
      data: {
        items: expiredTasks.map(et => ({
          ...et,
          snoozedUntil: et.snoozedUntil.toISOString(),
        })),
        total: expiredTasks.length,
      },
    }
  }

  /**
   * Process expired snoozes (unsnooze tasks whose snooze time has passed)
   */
  async processExpiredSnoozes(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoSnoozedTasks.userId, userId),
      lt(magictodoSnoozedTasks.snoozedUntil, new Date()),
    ]

    if (organizationId) {
      conditions.push(eq(magictodoSnoozedTasks.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoSnoozedTasks.teamId, teamId))
    }

    // Get and delete expired snoozes
    const expired = await db
      .delete(magictodoSnoozedTasks)
      .where(and(...conditions))
      .returning()

    return {
      ok: true,
      data: {
        unsnoozedCount: expired.length,
        unsnoozedTaskIds: expired.map(e => e.taskId),
      },
    }
  }

  /**
   * Check if a task is snoozed
   */
  async isTaskSnoozed(
    userId: string,
    taskId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoSnoozedTasks.taskId, taskId),
      eq(magictodoSnoozedTasks.userId, userId),
      sql`${magictodoSnoozedTasks.snoozedUntil} > NOW()`,
    ]

    if (organizationId) {
      conditions.push(eq(magictodoSnoozedTasks.organizationId, organizationId))
    }

    const [snooze] = await db
      .select({
        id: magictodoSnoozedTasks.id,
        snoozedUntil: magictodoSnoozedTasks.snoozedUntil,
        reason: magictodoSnoozedTasks.reason,
        dependencyTaskId: magictodoSnoozedTasks.dependencyTaskId,
      })
      .from(magictodoSnoozedTasks)
      .where(and(...conditions))

    return {
      ok: true,
      data: {
        isSnoozed: !!snooze,
        snooze: snooze ? {
          ...snooze,
          snoozedUntil: snooze.snoozedUntil.toISOString(),
        } : null,
      },
    }
  }

  /**
   * Get snooze statistics
   */
  async getStats(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [eq(magictodoSnoozedTasks.userId, userId)]

    if (organizationId) {
      conditions.push(eq(magictodoSnoozedTasks.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoSnoozedTasks.teamId, teamId))
    }

    const where = and(...conditions)

    const [stats] = await db
      .select({
        totalSnoozed: sql<number>`count(*)`,
        activeSnoozed: sql<number>`count(*) FILTER (WHERE ${magictodoSnoozedTasks.snoozedUntil} > NOW())`,
        expiredSnoozed: sql<number>`count(*) FILTER (WHERE ${magictodoSnoozedTasks.snoozedUntil} <= NOW())`,
        avgSnoozeCount: sql<number>`avg(${magictodoSnoozedTasks.snoozeCount})`,
        maxSnoozeCount: sql<number>`max(${magictodoSnoozedTasks.snoozeCount})`,
      })
      .from(magictodoSnoozedTasks)
      .where(where)

    return {
      ok: true,
      data: {
        totalSnoozed: Number(stats.totalSnoozed),
        activeSnoozed: Number(stats.activeSnoozed),
        expiredSnoozed: Number(stats.expiredSnoozed),
        avgSnoozeCount: Number(stats.avgSnoozeCount) || 0,
        maxSnoozeCount: Number(stats.maxSnoozeCount) || 0,
      },
    }
  }
}

export const magictodoSnoozeService = new MagictodoSnoozeService()

