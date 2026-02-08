/**
 * magictodo project service (server-side business logic).
 */

import "server-only"

import { eq, and, desc, asc, sql, isNull } from "drizzle-orm"
import {
  magictodoProjects,
  magictodoTasks,
  type DrizzleDB
} from "@afenda/magictodo/drizzle"
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  ProjectParams
} from "@afenda/magictodo/zod"
import { ok } from "@afenda/shared/server/response"

export const magictodoProjectServiceVersion = "0.1.0"

export class MagictodoProjectService {
  async initialize() {
    const readyAt = new Date().toISOString()
    return {
      ok: true,
      data: {
        status: "initialized",
        version: magictodoProjectServiceVersion,
        readyAt,
      },
    }
  }

  /**
   * List projects with optional filtering
   */
  async list(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    includeArchived: boolean = false,
    pagination: {
      limit: number
      offset: number
    },
    db: DrizzleDB
  ) {
    const conditions = [eq(magictodoProjects.userId, userId)]

    if (organizationId) {
      conditions.push(eq(magictodoProjects.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoProjects.teamId, teamId))
    }

    if (!includeArchived) {
      conditions.push(eq(magictodoProjects.archived, false))
    }

    const where = and(...conditions)

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(magictodoProjects)
      .where(where)

    // Query projects with task counts
    const projects = await db
      .select({
        id: magictodoProjects.id,
        name: magictodoProjects.name,
        description: magictodoProjects.description,
        color: magictodoProjects.color,
        userId: magictodoProjects.userId,
        archived: magictodoProjects.archived,
        defaultPriority: magictodoProjects.defaultPriority,
        tags: magictodoProjects.tags,
        customFields: magictodoProjects.customFields,
        createdAt: magictodoProjects.createdAt,
        updatedAt: magictodoProjects.updatedAt,
        organizationId: magictodoProjects.organizationId,
        teamId: magictodoProjects.teamId,
        // Subquery for task count
        taskCount: sql<number>`(
          SELECT count(*)
          FROM ${magictodoTasks} 
          WHERE ${magictodoTasks.projectId} = ${magictodoProjects.id}
        )`.as('taskCount'),
        // Subquery for active task count
        activeTaskCount: sql<number>`(
          SELECT count(*)
          FROM ${magictodoTasks} 
          WHERE ${magictodoTasks.projectId} = ${magictodoProjects.id}
          AND ${magictodoTasks.status} != 'done'
        )`.as('activeTaskCount'),
      })
      .from(magictodoProjects)
      .where(where)
      .orderBy(desc(magictodoProjects.updatedAt), asc(magictodoProjects.name))
      .limit(pagination.limit)
      .offset(pagination.offset)

    // Transform to response format
    const items = projects.map(project => ({
      ...project,
      createdAt: project.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: project.updatedAt?.toISOString() ?? new Date().toISOString(),
      taskCount: Number(project.taskCount),
      activeTaskCount: Number(project.activeTaskCount),
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
   * Get a single project by ID
   */
  async getById(
    userId: string,
    projectId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [
      eq(magictodoProjects.id, projectId),
      eq(magictodoProjects.userId, userId),
    ]

    if (organizationId) {
      conditions.push(eq(magictodoProjects.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoProjects.teamId, teamId))
    }

    const [project] = await db
      .select({
        id: magictodoProjects.id,
        name: magictodoProjects.name,
        description: magictodoProjects.description,
        color: magictodoProjects.color,
        userId: magictodoProjects.userId,
        archived: magictodoProjects.archived,
        defaultPriority: magictodoProjects.defaultPriority,
        tags: magictodoProjects.tags,
        customFields: magictodoProjects.customFields,
        createdAt: magictodoProjects.createdAt,
        updatedAt: magictodoProjects.updatedAt,
        organizationId: magictodoProjects.organizationId,
        teamId: magictodoProjects.teamId,
        taskCount: sql<number>`(
          SELECT count(*)
          FROM ${magictodoTasks} 
          WHERE ${magictodoTasks.projectId} = ${magictodoProjects.id}
        )`.as('taskCount'),
        activeTaskCount: sql<number>`(
          SELECT count(*)
          FROM ${magictodoTasks} 
          WHERE ${magictodoTasks.projectId} = ${magictodoProjects.id}
          AND ${magictodoTasks.status} != 'done'
        )`.as('activeTaskCount'),
      })
      .from(magictodoProjects)
      .where(and(...conditions))

    if (!project) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Project not found",
        },
      }
    }

    return {
      ok: true,
      data: {
        ...project,
        createdAt: project.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: project.updatedAt?.toISOString() ?? new Date().toISOString(),
        taskCount: Number(project.taskCount),
        activeTaskCount: Number(project.activeTaskCount),
      },
    }
  }

  /**
   * Create a new project
   */
  async create(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    input: CreateProjectRequest,
    db: DrizzleDB
  ) {
    const projectId = crypto.randomUUID()
    const now = new Date()

    const insertValues = {
      id: projectId,
      name: input.name,
      description: input.description || null,
      color: input.color || null,
      userId,
      archived: false,
      defaultPriority: (input as { defaultPriority?: string }).defaultPriority || "medium",
      tags: (input as { tags?: string[] }).tags || [],
      customFields: (input as { customFields?: Record<string, unknown> }).customFields || {},
      createdAt: now,
      updatedAt: now,
      organizationId,
      teamId,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle insert overload strictness with optional schema fields
    const result = await db.insert(magictodoProjects).values(insertValues as any).returning()
    const project = Array.isArray(result) ? result[0] : (result as { rows?: typeof insertValues[] })?.rows?.[0]
    if (!project) throw new Error("Failed to create project")

    return {
      ok: true,
      data: {
        ...project,
        createdAt: project.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: project.updatedAt?.toISOString() ?? new Date().toISOString(),
        taskCount: 0,
        activeTaskCount: 0,
      },
    }
  }

  /**
   * Update an existing project
   */
  async update(
    userId: string,
    projectId: string,
    organizationId: string | null,
    teamId: string | null,
    input: UpdateProjectRequest,
    db: DrizzleDB
  ) {
    // First check if project exists and user has permission
    const existing = await this.getById(userId, projectId, organizationId, teamId, db)
    if (!existing.ok) {
      return existing
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic drizzle update object built conditionally
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.color !== undefined) updateData.color = input.color
    if (input.archived !== undefined) updateData.archived = input.archived
    const ext = input as { defaultPriority?: string; tags?: string[]; customFields?: Record<string, unknown> }
    if (ext.defaultPriority !== undefined) updateData.defaultPriority = ext.defaultPriority
    if (ext.tags !== undefined) updateData.tags = ext.tags
    if (ext.customFields !== undefined) updateData.customFields = ext.customFields

    const [project] = await db
      .update(magictodoProjects)
      .set(updateData)
      .where(eq(magictodoProjects.id, projectId))
      .returning()

    // Get updated task counts
    const [taskCounts] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) FILTER (WHERE ${magictodoTasks.status} != 'done')`,
      })
      .from(magictodoTasks)
      .where(eq(magictodoTasks.projectId, projectId))

    return {
      ok: true,
      data: {
        ...project,
        createdAt: project.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: project.updatedAt?.toISOString() ?? new Date().toISOString(),
        taskCount: Number(taskCounts.total),
        activeTaskCount: Number(taskCounts.active),
      },
    }
  }

  /**
   * Delete a project
   */
  async delete(
    userId: string,
    projectId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    // First check if project exists
    const existing = await this.getById(userId, projectId, organizationId, teamId, db)
    if (!existing.ok) {
      return existing
    }

    // Check if project has tasks
    const [taskCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(magictodoTasks)
      .where(eq(magictodoTasks.projectId, projectId))

    if (Number(taskCount.count) > 0) {
      // Instead of deleting, archive the project
      await db
        .update(magictodoProjects)
        .set({
          archived: true,
          updatedAt: new Date(),
        })
        .where(eq(magictodoProjects.id, projectId))

      return {
        ok: true,
        data: {
          id: projectId,
          archived: true,
          message: "Project archived because it contains tasks",
        },
      }
    }

    // Delete the project if no tasks
    await db
      .delete(magictodoProjects)
      .where(eq(magictodoProjects.id, projectId))

    return {
      ok: true,
      data: {
        id: projectId,
        deleted: true,
      },
    }
  }

  /**
   * Get project statistics
   */
  async getStats(
    userId: string,
    organizationId: string | null,
    teamId: string | null,
    db: DrizzleDB
  ) {
    const conditions = [eq(magictodoProjects.userId, userId)]

    if (organizationId) {
      conditions.push(eq(magictodoProjects.organizationId, organizationId))
    }

    if (teamId) {
      conditions.push(eq(magictodoProjects.teamId, teamId))
    }

    const where = and(...conditions)

    const [stats] = await db
      .select({
        totalProjects: sql<number>`count(*)`,
        archivedProjects: sql<number>`count(*) FILTER (WHERE ${magictodoProjects.archived} = true)`,
        activeProjects: sql<number>`count(*) FILTER (WHERE ${magictodoProjects.archived} = false)`,
      })
      .from(magictodoProjects)
      .where(where)

    // Get task distribution across projects
    const taskDistribution = await db
      .select({
        projectId: magictodoProjects.id,
        projectName: magictodoProjects.name,
        taskCount: sql<number>`count(*)`,
        completedTasks: sql<number>`count(*) FILTER (WHERE ${magictodoTasks.status} = 'done')`,
      })
      .from(magictodoProjects)
      .leftJoin(magictodoTasks, eq(magictodoTasks.projectId, magictodoProjects.id))
      .where(and(...conditions))
      .groupBy(magictodoProjects.id, magictodoProjects.name)
      .orderBy(desc(sql`count(*)`))
      .limit(10)

    return {
      ok: true,
      data: {
        totalProjects: Number(stats.totalProjects),
        archivedProjects: Number(stats.archivedProjects),
        activeProjects: Number(stats.activeProjects),
        topProjectsByTaskCount: taskDistribution.map(p => ({
          ...p,
          taskCount: Number(p.taskCount),
          completedTasks: Number(p.completedTasks),
        })),
      },
    }
  }
}

export const magictodoProjectService = new MagictodoProjectService()

