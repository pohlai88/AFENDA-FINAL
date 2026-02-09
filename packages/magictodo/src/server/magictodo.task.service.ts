/**
 * magictodo task service (server-side business logic).
 */

import "server-only"

import { eq, and, inArray, desc, asc, sql, or } from "drizzle-orm"
import {
  magictodoTasks,
  magictodoProjects,
  magictodoTaskDependencies,
  magictodoTimeEntries,
  type DrizzleDB
} from "@afenda/magictodo/drizzle"
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  TASK_STATUS,
  TASK_PRIORITY
} from "@afenda/magictodo/zod"

export const magictodoTaskServiceVersion = "0.1.0"

export class MagictodoTaskService {
  async initialize() {
    const readyAt = new Date().toISOString()
    return {
      ok: true,
      data: {
        status: "initialized",
        version: magictodoTaskServiceVersion,
        readyAt,
      },
    }
  }

  /**
   * List tasks with filtering and pagination
   */
  async list(
    userId: string,
    tenantId: string | null,
    teamId: string | null,
    filters: {
      status?: string[]
      priority?: string
      projectId?: string
    },
    pagination: {
      limit: number
      offset: number
    },
    db: DrizzleDB
  ) {
    // Build where conditions
    const conditions = [eq(magictodoTasks.userId, userId)]

    if (tenantId) {
      conditions.push(eq(magictodoTasks.tenantId, tenantId))
    }

    if (teamId) {
      conditions.push(eq(magictodoTasks.teamId, teamId))
    }

    if (filters.status && filters.status.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle enum cast required for inArray
      conditions.push(inArray(magictodoTasks.status, filters.status as any[]))
    }

    if (filters.priority) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle enum cast required for eq
      conditions.push(eq(magictodoTasks.priority, filters.priority as any))
    }

    if (filters.projectId) {
      conditions.push(eq(magictodoTasks.projectId, filters.projectId))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(magictodoTasks)
      .where(where)

    // Query tasks with optional project join
    const tasks = await db
      .select({
        id: magictodoTasks.id,
        title: magictodoTasks.title,
        description: magictodoTasks.description,
        status: magictodoTasks.status,
        priority: magictodoTasks.priority,
        dueDate: magictodoTasks.dueDate,
        projectId: magictodoTasks.projectId,
        userId: magictodoTasks.userId,
        parentTaskId: magictodoTasks.parentTaskId,
        completedAt: magictodoTasks.completedAt,
        recurrenceRule: magictodoTasks.recurrenceRule,
        nextOccurrenceDate: magictodoTasks.nextOccurrenceDate,
        estimatedMinutes: magictodoTasks.estimatedMinutes,
        actualMinutes: magictodoTasks.actualMinutes,
        tags: magictodoTasks.tags,
        customFields: magictodoTasks.customFields,
        position: magictodoTasks.position,
        createdAt: magictodoTasks.createdAt,
        updatedAt: magictodoTasks.updatedAt,
        tenantId: magictodoTasks.tenantId,
        teamId: magictodoTasks.teamId,
        // Optional project info
        projectName: magictodoProjects.name,
        projectColor: magictodoProjects.color,
      })
      .from(magictodoTasks)
      .leftJoin(magictodoProjects, eq(magictodoTasks.projectId, magictodoProjects.id))
      .where(where)
      .orderBy(desc(magictodoTasks.createdAt), asc(magictodoTasks.position))
      .limit(pagination.limit)
      .offset(pagination.offset)

    // Transform to response format
    const items = tasks.map(task => ({
      ...task,
      dueDate: task.dueDate?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      nextOccurrenceDate: task.nextOccurrenceDate?.toISOString(),
    }))

    return {
      ok: true,
      data: {
        items,
        total: Number(count),
        limit: pagination.limit,
        offset: pagination.offset,
      },
    }
  }

  /**
   * Get a single task by ID
   */
  async getById(
    userId: string,
    taskId: string,
    tenantId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoTasks.id, taskId),
      eq(magictodoTasks.userId, userId),
    ]

    if (tenantId) {
      conditions.push(eq(magictodoTasks.tenantId, tenantId))
    }

    if (teamId) {
      conditions.push(eq(magictodoTasks.teamId, teamId))
    }

    const [task] = await db
      .select({
        id: magictodoTasks.id,
        title: magictodoTasks.title,
        description: magictodoTasks.description,
        status: magictodoTasks.status,
        priority: magictodoTasks.priority,
        dueDate: magictodoTasks.dueDate,
        projectId: magictodoTasks.projectId,
        userId: magictodoTasks.userId,
        parentTaskId: magictodoTasks.parentTaskId,
        completedAt: magictodoTasks.completedAt,
        recurrenceRule: magictodoTasks.recurrenceRule,
        nextOccurrenceDate: magictodoTasks.nextOccurrenceDate,
        estimatedMinutes: magictodoTasks.estimatedMinutes,
        actualMinutes: magictodoTasks.actualMinutes,
        tags: magictodoTasks.tags,
        customFields: magictodoTasks.customFields,
        position: magictodoTasks.position,
        createdAt: magictodoTasks.createdAt,
        updatedAt: magictodoTasks.updatedAt,
        tenantId: magictodoTasks.tenantId,
        teamId: magictodoTasks.teamId,
        projectName: magictodoProjects.name,
        projectColor: magictodoProjects.color,
      })
      .from(magictodoTasks)
      .leftJoin(magictodoProjects, eq(magictodoTasks.projectId, magictodoProjects.id))
      .where(and(...conditions))

    if (!task) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Task not found",
        },
      }
    }

    return {
      ok: true,
      data: {
        ...task,
        dueDate: task.dueDate?.toISOString(),
        completedAt: task.completedAt?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        nextOccurrenceDate: task.nextOccurrenceDate?.toISOString(),
      },
    }
  }

  /**
   * Create a new task
   */
  async create(
    userId: string,
    tenantId: string | null,
    teamId: string | null,
    input: CreateTaskRequest,
    db: DrizzleDB
  ) {
    const taskId = crypto.randomUUID()
    const now = new Date()

    const result = await db
      .insert(magictodoTasks)
      .values({
        id: taskId,
        title: input.title,
        description: input.description || null,
        status: input.status || TASK_STATUS.TODO,
        priority: input.priority || TASK_PRIORITY.MEDIUM,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        projectId: input.projectId || null,
        userId,
        parentTaskId: input.parentTaskId || null,
        recurrenceRule: input.recurrence ? JSON.stringify(input.recurrence) : null,
        tags: input.tags || [],
        customFields: (input as { customFields?: Record<string, unknown> }).customFields ?? {},
        position: 0, // TODO: Calculate position based on existing tasks
        createdAt: now,
        updatedAt: now,
        tenantId,
        teamId,
      })
      .returning()
    const task = Array.isArray(result) ? result[0] : (result as { rows?: unknown[] })?.rows?.[0]
    if (!task) throw new Error("Failed to create task")

    const t = task as { dueDate?: Date | null; createdAt?: Date | null; updatedAt?: Date | null; [k: string]: unknown }
    return {
      ok: true,
      data: {
        ...task,
        dueDate: t.dueDate?.toISOString(),
        createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: t.updatedAt?.toISOString() ?? new Date().toISOString(),
      },
    }
  }

  /**
   * Update an existing task
   */
  async update(
    userId: string,
    taskId: string,
    tenantId: string | null,
    teamId: string | null,
    input: UpdateTaskRequest,
    db: DrizzleDB
  ) {
    // First check if task exists and user has permission
    const existing = await this.getById(userId, taskId, tenantId, teamId, db)
    if (!existing.ok) {
      return existing
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic drizzle update object built conditionally
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.status !== undefined) {
      updateData.status = input.status
      if (input.status === TASK_STATUS.DONE && !existing.data?.completedAt) {
        updateData.completedAt = new Date()
      } else if (input.status !== TASK_STATUS.DONE) {
        updateData.completedAt = null
      }
    }
    if (input.priority !== undefined) updateData.priority = input.priority
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null
    if (input.projectId !== undefined) updateData.projectId = input.projectId
    if (input.tags !== undefined) updateData.tags = input.tags
    if (input.recurrence !== undefined) {
      updateData.recurrenceRule = input.recurrence ? JSON.stringify(input.recurrence) : null
    }

    const [task] = await db
      .update(magictodoTasks)
      .set(updateData)
      .where(eq(magictodoTasks.id, taskId))
      .returning()

    return {
      ok: true,
      data: {
        ...task,
        dueDate: task.dueDate?.toISOString(),
        completedAt: task.completedAt?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
    }
  }

  /**
   * Delete a task
   */
  async delete(
    userId: string,
    taskId: string,
    tenantId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    // First check if task exists
    const existing = await this.getById(userId, taskId, tenantId, teamId, db)
    if (!existing.ok) {
      return existing
    }

    // Delete related records first (dependencies, time entries)
    await db
      .delete(magictodoTaskDependencies)
      .where(
        or(
          eq(magictodoTaskDependencies.taskId, taskId),
          eq(magictodoTaskDependencies.dependsOnTaskId, taskId)
        )
      )

    await db
      .delete(magictodoTimeEntries)
      .where(eq(magictodoTimeEntries.taskId, taskId))

    // Delete the task
    await db
      .delete(magictodoTasks)
      .where(eq(magictodoTasks.id, taskId))

    return {
      ok: true,
      data: {
        id: taskId,
        deleted: true,
      },
    }
  }

  /**
   * Get task statistics
   */
  async getStats(
    userId: string,
    tenantId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [eq(magictodoTasks.userId, userId)]

    if (tenantId) {
      conditions.push(eq(magictodoTasks.tenantId, tenantId))
    }

    if (teamId) {
      conditions.push(eq(magictodoTasks.teamId, teamId))
    }

    const where = and(...conditions)

    const stats = await db
      .select({
        status: magictodoTasks.status,
        count: sql<number>`count(*)`,
      })
      .from(magictodoTasks)
      .where(where)
      .groupBy(magictodoTasks.status)

    const total = stats.reduce((sum, stat) => sum + Number(stat.count), 0)
    const completed = stats.find(s => s.status === TASK_STATUS.DONE)?.count || 0

    return {
      ok: true,
      data: {
        total,
        completed,
        pending: total - completed,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = Number(stat.count)
          return acc
        }, {} as Record<string, number>),
      },
    }
  }
}

export const magictodoTaskService = new MagictodoTaskService()


