/**
 * @domain tenancy
 * @layer zod
 * @responsibility Teams API contract schemas
 */

import { z } from "zod"
import { TENANCY_CONSTANTS } from "../constant/tenancy.constant"

// ============ Team Schemas ============

export const tenancyCreateTeamSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  name: z.string()
    .min(1, "Team name is required")
    .max(TENANCY_CONSTANTS.TEAM.MAX_NAME_LENGTH, `Team name must be less than ${TENANCY_CONSTANTS.TEAM.MAX_NAME_LENGTH} characters`),
  slug: z.string()
    .min(1, "Team slug is required")
    .max(TENANCY_CONSTANTS.TEAM.MAX_SLUG_LENGTH, `Team slug must be less than ${TENANCY_CONSTANTS.TEAM.MAX_SLUG_LENGTH} characters`)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string()
    .max(TENANCY_CONSTANTS.TEAM.MAX_DESCRIPTION_LENGTH, `Description must be less than ${TENANCY_CONSTANTS.TEAM.MAX_DESCRIPTION_LENGTH} characters`)
    .optional(),
  parentId: z.string().uuid("Invalid parent team ID").optional(),
})

export const tenancyUpdateTeamSchema = tenancyCreateTeamSchema.partial().omit({ organizationId: true })

export const tenancyTeamParamsSchema = z.object({
  id: z.string().uuid("Invalid team ID"),
})

export const tenancyTeamQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
})

export const tenancyTeamResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  settings: z.record(z.string(), z.any()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  memberCount: z.number().optional(),
  parentTeam: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),
})

// ============ Types ============
export type TenancyCreateTeam = z.infer<typeof tenancyCreateTeamSchema>
export type TenancyUpdateTeam = z.infer<typeof tenancyUpdateTeamSchema>
export type TenancyTeamParams = z.infer<typeof tenancyTeamParamsSchema>
export type TenancyTeamQuery = z.infer<typeof tenancyTeamQuerySchema>
export type TenancyTeamResponse = z.infer<typeof tenancyTeamResponseSchema>
