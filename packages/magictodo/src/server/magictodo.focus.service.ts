/**
 * magictodo focus service (server-side business logic).
 */

import "server-only"

import { eq, and, inArray, desc, asc, sql, isNull } from "drizzle-orm"
import {
  magictodoFocusSessions,
  magictodoFocusSessionQueue,
  magictodoTasks,
  type DrizzleDB
} from "@afenda/magictodo/drizzle"

export const magictodoFocusServiceVersion = "0.1.0"

export class MagictodoFocusService {
  async initialize() {
    const readyAt = new Date().toISOString()
    return {
      ok: true,
      data: {
        status: "initialized",
        version: magictodoFocusServiceVersion,
        readyAt,
      },
    }
  }

  /**
   * Get current active focus session
   */
  async getCurrentSession(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoFocusSessions.userId, userId),
      inArray(magictodoFocusSessions.status, ["active", "paused"])
    ]

    if (organizationId) {
      conditions.push(eq(magictodoFocusSessions.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoFocusSessions.teamId, teamId))
    }

    const [session] = await db
      .select({
        id: magictodoFocusSessions.id,
        userId: magictodoFocusSessions.userId,
        status: magictodoFocusSessions.status,
        currentTaskId: magictodoFocusSessions.currentTaskId,
        startedAt: magictodoFocusSessions.startedAt,
        endedAt: magictodoFocusSessions.endedAt,
        totalFocusTime: magictodoFocusSessions.totalFocusTime,
        tasksCompleted: magictodoFocusSessions.tasksCompleted,
        tasksSkipped: magictodoFocusSessions.tasksSkipped,
        breaks: magictodoFocusSessions.breaks,
        dailyGoal: magictodoFocusSessions.dailyGoal,
        settings: magictodoFocusSessions.settings,
        createdAt: magictodoFocusSessions.createdAt,
        updatedAt: magictodoFocusSessions.updatedAt,
      })
      .from(magictodoFocusSessions)
      .where(and(...conditions))
      .orderBy(desc(magictodoFocusSessions.createdAt))
      .limit(1)

    if (!session) {
      return {
        ok: true,
        data: { session: null }
      }
    }

    // Get queue items
    const queue = await db
      .select({
        id: magictodoFocusSessionQueue.id,
        taskId: magictodoFocusSessionQueue.taskId,
        position: magictodoFocusSessionQueue.position,
        addedAt: magictodoFocusSessionQueue.addedAt,
        skippedCount: magictodoFocusSessionQueue.skippedCount,
        completedAt: magictodoFocusSessionQueue.completedAt,
      })
      .from(magictodoFocusSessionQueue)
      .where(eq(magictodoFocusSessionQueue.sessionId, session.id))
      .orderBy(asc(magictodoFocusSessionQueue.position))

    // Get task details for queue
    const taskIds = queue.map(q => q.taskId)
    const tasks = taskIds.length > 0 ? await db
      .select({
        id: magictodoTasks.id,
        title: magictodoTasks.title,
        description: magictodoTasks.description,
        status: magictodoTasks.status,
        priority: magictodoTasks.priority,
        dueDate: magictodoTasks.dueDate,
      })
      .from(magictodoTasks)
      .where(inArray(magictodoTasks.id, taskIds))
      : []

    const taskMap = tasks.reduce((map, task) => {
      map[task.id] = task
      return map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle query result shape is dynamic
    }, {} as Record<string, any>)

    return {
      ok: true,
      data: {
        session: {
          ...session,
          startedAt: session.startedAt?.toISOString(),
          endedAt: session.endedAt?.toISOString(),
          createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: session.updatedAt?.toISOString() ?? new Date().toISOString(),
          queue: queue.map(q => ({
            ...q,
            addedAt: q.addedAt?.toISOString(),
            completedAt: q.completedAt?.toISOString(),
            task: taskMap[q.taskId] || null,
          }))
        }
      }
    }
  }

  /**
   * Start a new focus session
   */
  async startSession(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    input: {
      taskIds: string[]
      dailyGoal?: number
      settings?: Record<string, unknown>
    },
    db: DrizzleDB
  ) {
    if (!input.taskIds || input.taskIds.length === 0) {
      return {
        ok: false,
        error: {
          code: "INVALID_INPUT",
          message: "At least one task is required",
        },
      }
    }

    // Check for existing active session
    const existing = await this.getCurrentSession(userId, organizationId, teamId, db)
    if (existing.data.session) {
      return {
        ok: false,
        error: {
          code: "SESSION_EXISTS",
          message: "Already have an active focus session",
        },
      }
    }

    // Verify all tasks exist and belong to user
    const taskConditions = [
      inArray(magictodoTasks.id, input.taskIds),
      eq(magictodoTasks.userId, userId)
    ]

    if (organizationId) {
      taskConditions.push(eq(magictodoTasks.organizationId, organizationId))
    }

    const userTasks = await db
      .select({ id: magictodoTasks.id })
      .from(magictodoTasks)
      .where(and(...taskConditions))

    if (userTasks.length !== input.taskIds.length) {
      return {
        ok: false,
        error: {
          code: "TASKS_NOT_FOUND",
          message: "Some tasks not found or don't belong to you",
        },
      }
    }

    const sessionId = crypto.randomUUID()
    const now = new Date()

    // Create session
    const [session] = await db
      .insert(magictodoFocusSessions)
      .values({
        id: sessionId,
        userId,
        status: "active",
        currentTaskId: input.taskIds[0],
        dailyGoal: input.dailyGoal || 5,
        settings: input.settings || {},
        startedAt: now,
        createdAt: now,
        updatedAt: now,
        organizationId,
        teamId,
      })
      .returning()

    // Create queue items
    const queueItems = input.taskIds.map((taskId, index) => ({
      sessionId,
      taskId,
      position: index,
      addedAt: now,
    }))

    await db
      .insert(magictodoFocusSessionQueue)
      .values(queueItems)

    return {
      ok: true,
      data: {
        ...session,
        startedAt: session.startedAt?.toISOString(),
        createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: session.updatedAt?.toISOString() ?? new Date().toISOString(),
      }
    }
  }

  /**
   * Pause/Resume focus session
   */
  async toggleSession(
    userId: string,
    sessionId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoFocusSessions.id, sessionId),
      eq(magictodoFocusSessions.userId, userId),
    ]

    if (organizationId) {
      conditions.push(eq(magictodoFocusSessions.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoFocusSessions.teamId, teamId))
    }

    const [session] = await db
      .select({ status: magictodoFocusSessions.status })
      .from(magictodoFocusSessions)
      .where(and(...conditions))

    if (!session) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Focus session not found",
        },
      }
    }

    const newStatus = session.status === "active" ? "paused" : "active"

    const [updated] = await db
      .update(magictodoFocusSessions)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(magictodoFocusSessions.id, sessionId))
      .returning()

    return {
      ok: true,
      data: {
        ...updated,
        startedAt: updated.startedAt?.toISOString(),
        createdAt: updated.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: updated.updatedAt?.toISOString() ?? new Date().toISOString(),
      }
    }
  }

  /**
   * End focus session
   */
  async endSession(
    userId: string,
    sessionId: string,
    organizationId: string | null,
    teamId: string | null,
    status: "completed" | "aborted" = "completed",
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoFocusSessions.id, sessionId),
      eq(magictodoFocusSessions.userId, userId),
    ]

    if (organizationId) {
      conditions.push(eq(magictodoFocusSessions.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoFocusSessions.teamId, teamId))
    }

    const now = new Date()

    const [session] = await db
      .update(magictodoFocusSessions)
      .set({
        status,
        endedAt: now,
        updatedAt: now,
      })
      .where(and(...conditions))
      .returning()

    if (!session) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Focus session not found",
        },
      }
    }

    // Calculate total focus time if not set
    let totalFocusTime = session.totalFocusTime
    if (session.startedAt && !totalFocusTime) {
      totalFocusTime = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000)

      await db
        .update(magictodoFocusSessions)
        .set({ totalFocusTime })
        .where(eq(magictodoFocusSessions.id, sessionId))
    }

    return {
      ok: true,
      data: {
        ...session,
        totalFocusTime,
        startedAt: session.startedAt?.toISOString(),
        endedAt: session.endedAt?.toISOString(),
        createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: session.updatedAt?.toISOString() ?? new Date().toISOString(),
      }
    }
  }

  /**
   * Complete current task and move to next
   */
  async completeTask(
    userId: string,
    sessionId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    // Get current session
    const sessionResult = await this.getCurrentSession(userId, organizationId, teamId, db)
    if (!sessionResult.ok || !sessionResult.data.session) {
      return {
        ok: false,
        error: {
          code: "NO_ACTIVE_SESSION",
          message: "No active focus session",
        },
      }
    }

    const session = sessionResult.data.session
    const currentTaskId = session.currentTaskId

    if (!currentTaskId) {
      return {
        ok: false,
        error: {
          code: "NO_CURRENT_TASK",
          message: "No current task in session",
        },
      }
    }

    // Mark task as completed in queue
    await db
      .update(magictodoFocusSessionQueue)
      .set({
        completedAt: new Date(),
      })
      .where(
        and(
          eq(magictodoFocusSessionQueue.sessionId, sessionId),
          eq(magictodoFocusSessionQueue.taskId, currentTaskId)
        )
      )

    // Find next task in queue
    const [nextTask] = await db
      .select({
        taskId: magictodoFocusSessionQueue.taskId,
        position: magictodoFocusSessionQueue.position,
      })
      .from(magictodoFocusSessionQueue)
      .where(
        and(
          eq(magictodoFocusSessionQueue.sessionId, sessionId),
          sql`${magictodoFocusSessionQueue.position} > ${session.queue.find(q => q.taskId === currentTaskId)?.position || 0}`,
          isNull(magictodoFocusSessionQueue.completedAt)
        )
      )
      .orderBy(asc(magictodoFocusSessionQueue.position))
      .limit(1)

    // Update session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic drizzle update object built conditionally
    const updateData: any = {
      tasksCompleted: (session.tasksCompleted ?? 0) + 1,
      updatedAt: new Date(),
    }

    if (nextTask) {
      updateData.currentTaskId = nextTask.taskId
    } else {
      updateData.currentTaskId = null
      updateData.status = "completed"
      updateData.endedAt = new Date()
    }

    const [updatedSession] = await db
      .update(magictodoFocusSessions)
      .set(updateData)
      .where(eq(magictodoFocusSessions.id, sessionId))
      .returning()

    return {
      ok: true,
      data: {
        ...updatedSession,
        startedAt: updatedSession.startedAt?.toISOString(),
        endedAt: updatedSession.endedAt?.toISOString(),
        createdAt: updatedSession.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: updatedSession.updatedAt?.toISOString() ?? new Date().toISOString(),
        nextTaskId: nextTask?.taskId || null,
      }
    }
  }

  /**
   * Skip current task
   */
  async skipTask(
    userId: string,
    sessionId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    // Get current session
    const sessionResult = await this.getCurrentSession(userId, organizationId, teamId, db)
    if (!sessionResult.ok || !sessionResult.data.session) {
      return {
        ok: false,
        error: {
          code: "NO_ACTIVE_SESSION",
          message: "No active focus session",
        },
      }
    }

    const session = sessionResult.data.session
    const currentTaskId = session.currentTaskId

    if (!currentTaskId) {
      return {
        ok: false,
        error: {
          code: "NO_CURRENT_TASK",
          message: "No current task in session",
        },
      }
    }

    // Increment skip count for task
    await db
      .update(magictodoFocusSessionQueue)
      .set({
        skippedCount: sql`${magictodoFocusSessionQueue.skippedCount} + 1`,
      })
      .where(
        and(
          eq(magictodoFocusSessionQueue.sessionId, sessionId),
          eq(magictodoFocusSessionQueue.taskId, currentTaskId)
        )
      )

    // Find next task in queue
    const [nextTask] = await db
      .select({
        taskId: magictodoFocusSessionQueue.taskId,
        position: magictodoFocusSessionQueue.position,
      })
      .from(magictodoFocusSessionQueue)
      .where(
        and(
          eq(magictodoFocusSessionQueue.sessionId, sessionId),
          sql`${magictodoFocusSessionQueue.position} > ${session.queue.find(q => q.taskId === currentTaskId)?.position || 0}`,
          isNull(magictodoFocusSessionQueue.completedAt)
        )
      )
      .orderBy(asc(magictodoFocusSessionQueue.position))
      .limit(1)

    // Update session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic drizzle update object built conditionally
    const updateData: any = {
      tasksSkipped: (session.tasksSkipped ?? 0) + 1,
      updatedAt: new Date(),
    }

    if (nextTask) {
      updateData.currentTaskId = nextTask.taskId
    } else {
      updateData.currentTaskId = null
      updateData.status = "completed"
      updateData.endedAt = new Date()
    }

    const [updatedSession] = await db
      .update(magictodoFocusSessions)
      .set(updateData)
      .where(eq(magictodoFocusSessions.id, sessionId))
      .returning()

    return {
      ok: true,
      data: {
        ...updatedSession,
        startedAt: updatedSession.startedAt?.toISOString(),
        endedAt: updatedSession.endedAt?.toISOString(),
        createdAt: updatedSession.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: updatedSession.updatedAt?.toISOString() ?? new Date().toISOString(),
        nextTaskId: nextTask?.taskId || null,
      }
    }
  }

  /**
   * Get focus statistics
   */
  async getStats(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    period: "today" | "week" | "month" | "all" = "all",
    db: DrizzleDB
  ) {
    const conditions = [eq(magictodoFocusSessions.userId, userId)]

    if (organizationId) {
      conditions.push(eq(magictodoFocusSessions.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoFocusSessions.teamId, teamId))
    }

    // Add date filter based on period
    const now = new Date()
    let startDate: Date | null = null

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    if (startDate) {
      conditions.push(sql`${magictodoFocusSessions.startedAt} >= ${startDate}`)
    }

    const where = and(...conditions)

    const stats = await db
      .select({
        totalSessions: sql<number>`count(*)`,
        totalFocusTime: sql<number>`sum(${magictodoFocusSessions.totalFocusTime})`,
        totalTasksCompleted: sql<number>`sum(${magictodoFocusSessions.tasksCompleted})`,
        totalTasksSkipped: sql<number>`sum(${magictodoFocusSessions.tasksSkipped})`,
        avgSessionDuration: sql<number>`avg(${magictodoFocusSessions.totalFocusTime})`,
      })
      .from(magictodoFocusSessions)
      .where(where)

    const stat = stats[0]

    return {
      ok: true,
      data: {
        totalSessions: Number(stat.totalSessions) || 0,
        totalFocusTime: Number(stat.totalFocusTime) || 0,
        totalTasksCompleted: Number(stat.totalTasksCompleted) || 0,
        totalTasksSkipped: Number(stat.totalTasksSkipped) || 0,
        avgSessionDuration: Number(stat.avgSessionDuration) || 0,
        period,
      }
    }
  }

  /**
   * Get focus streak statistics based on completed sessions per day.
   */
  async getStreak(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoFocusSessions.userId, userId),
      eq(magictodoFocusSessions.status, "completed"),
      sql`${magictodoFocusSessions.endedAt} is not null`,
    ]

    if (organizationId) {
      conditions.push(eq(magictodoFocusSessions.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoFocusSessions.teamId, teamId))
    }

    const rows = await db
      .select({
        day: sql<string>`date(${magictodoFocusSessions.endedAt})`,
      })
      .from(magictodoFocusSessions)
      .where(and(...conditions))
      .groupBy(sql`date(${magictodoFocusSessions.endedAt})`)
      .orderBy(desc(sql`date(${magictodoFocusSessions.endedAt})`))
      .limit(365)

    const daySet = new Set(rows.map((row) => row.day).filter(Boolean))

    const sortedDays = Array.from(daySet).sort()
    let longestStreak = 0
    let currentStreak = 0

    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        currentStreak = 1
        longestStreak = Math.max(longestStreak, currentStreak)
        continue
      }

      const prev = new Date(sortedDays[i - 1] as string)
      const curr = new Date(sortedDays[i] as string)
      const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000))

      if (diffDays === 1) {
        currentStreak += 1
      } else {
        currentStreak = 1
      }
      longestStreak = Math.max(longestStreak, currentStreak)
    }

    let todayStreak = 0
    const cursor = new Date()
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().split("T")[0]
      if (key && daySet.has(key)) {
        todayStreak += 1
      } else {
        break
      }
      cursor.setDate(cursor.getDate() - 1)
    }

    return {
      ok: true,
      data: {
        currentStreak: todayStreak,
        longestStreak,
        activeDays: daySet.size,
      }
    }
  }
}

export const magictodoFocusService = new MagictodoFocusService()

