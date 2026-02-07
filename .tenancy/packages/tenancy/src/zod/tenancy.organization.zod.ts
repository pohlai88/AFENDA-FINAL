/**
 * @domain tenancy
 * @layer zod
 * @responsibility Organizations API contract schemas
 */

import { z } from "zod"
import { TENANCY_CONSTANTS } from "../constant/tenancy.constant"

// ============ Organization Schemas ============

export const tenancyCreateOrganizationSchema = z.object({
  name: z.string()
    .min(1, "Organization name is required")
    .max(TENANCY_CONSTANTS.ORGANIZATION.MAX_NAME_LENGTH, `Organization name must be less than ${TENANCY_CONSTANTS.ORGANIZATION.MAX_NAME_LENGTH} characters`),
  slug: z.string()
    .min(1, "Organization slug is required")
    .max(TENANCY_CONSTANTS.ORGANIZATION.MAX_SLUG_LENGTH, `Organization slug must be less than ${TENANCY_CONSTANTS.ORGANIZATION.MAX_SLUG_LENGTH} characters`)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string()
    .max(TENANCY_CONSTANTS.ORGANIZATION.MAX_DESCRIPTION_LENGTH, `Description must be less than ${TENANCY_CONSTANTS.ORGANIZATION.MAX_DESCRIPTION_LENGTH} characters`)
    .optional(),
  logo: z.string().url().optional(),
})

export const tenancyUpdateOrganizationSchema = tenancyCreateOrganizationSchema.partial()

export const tenancyOrganizationParamsSchema = z.object({
  id: z.string().uuid("Invalid organization ID"),
})

export const tenancyOrganizationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
})

export const tenancyOrganizationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  logo: z.string().nullable(),
  settings: z.record(z.string(), z.any()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  memberCount: z.number().optional(),
  teamCount: z.number().optional(),
})

// ============ Types ============
export type TenancyCreateOrganization = z.infer<typeof tenancyCreateOrganizationSchema>
export type TenancyUpdateOrganization = z.infer<typeof tenancyUpdateOrganizationSchema>
export type TenancyOrganizationParams = z.infer<typeof tenancyOrganizationParamsSchema>
export type TenancyOrganizationQuery = z.infer<typeof tenancyOrganizationQuerySchema>
export type TenancyOrganizationResponse = z.infer<typeof tenancyOrganizationResponseSchema>
