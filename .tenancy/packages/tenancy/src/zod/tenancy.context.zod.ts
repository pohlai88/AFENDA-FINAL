/**
 * @domain tenancy
 * @layer zod
 * @responsibility Core tenancy context schema
 */

import { z } from "zod"

/**
 * MagicToDo Tenancy Model
 *
 * Individual-first architecture: every user owns their workspace, tasks, and projects.
 * Scaling path: individual → organization (multiple users) → team (sub-projects/roles).
 *
 * Key rules:
 * - User ID is the primary tenant boundary.
 * - All tasks, projects, and data are scoped by user_id.
 * - Authentication provides user_id; all queries filter by user_id.
 * - Future: Org/team expansion via membership table.
 */

export const tenancyContextSchema = z.object({
  userId: z.string().min(1, "User ID is required").describe("Primary tenant ID"),
  orgId: z.string().optional().describe("Organization ID for multi-tenant access"),
  teamId: z.string().optional().describe("Team ID for team-scoped access"),
  permission: z.string().optional().describe("Required permission for the request"),
})

export type TenancyContext = z.infer<typeof tenancyContextSchema>

/**
 * Resource sharing schemas
 */
export const tenancyShareResourceSchema = z.object({
  resourceType: z.enum(["project", "task"]),
  resourceId: z.string().uuid("Invalid resource ID"),
  targetType: z.enum(["user", "organization", "team"]),
  targetId: z.string().uuid("Invalid target ID"),
  permissions: z.object({
    read: z.boolean().default(true),
    write: z.boolean().default(false),
    admin: z.boolean().default(false),
  }),
  expiresAt: z.string().datetime().optional(),
})

export const tenancyUpdateShareSchema = z.object({
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    admin: z.boolean(),
  }),
  expiresAt: z.string().datetime().optional(),
})

export const tenancyShareParamsSchema = z.object({
  id: z.string().uuid("Invalid share ID"),
})

export const tenancyShareQuerySchema = z.object({
  resourceType: z.enum(["project", "task"]).optional(),
  resourceId: z.string().uuid().optional(),
  targetType: z.enum(["user", "team", "organization"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

/**
 * Permission check schema
 */
export const tenancyCheckPermissionSchema = z.object({
  permission: z.string().min(1, "Permission is required"),
  context: z.object({
    organizationId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    resourceId: z.string().uuid().optional(),
    resourceType: z.enum(["project", "task"]).optional(),
  }).optional(),
})

/**
 * Response schemas
 */
export const tenancyShareResponseSchema = z.object({
  id: z.string().uuid(),
  resourceType: z.string(),
  resourceId: z.string().uuid(),
  targetType: z.string(),
  targetId: z.string().uuid(),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    admin: z.boolean(),
  }),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  resource: z.record(z.string(), z.any()).optional(),
  target: z.record(z.string(), z.any()).optional(),
})

export const tenancyPermissionCheckResponseSchema = z.object({
  hasPermission: z.boolean(),
  permissions: z.array(z.string()),
})

// ============ Types ============
export type TenancyShareResource = z.infer<typeof tenancyShareResourceSchema>
export type TenancyUpdateShare = z.infer<typeof tenancyUpdateShareSchema>
export type TenancyShareParams = z.infer<typeof tenancyShareParamsSchema>
export type TenancyShareQuery = z.infer<typeof tenancyShareQuerySchema>
export type TenancyCheckPermission = z.infer<typeof tenancyCheckPermissionSchema>
export type TenancyShareResponse = z.infer<typeof tenancyShareResponseSchema>
export type TenancyPermissionCheckResponse = z.infer<typeof tenancyPermissionCheckResponseSchema>
