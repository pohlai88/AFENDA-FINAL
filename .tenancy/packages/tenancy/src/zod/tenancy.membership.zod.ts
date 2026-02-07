/**
 * @domain tenancy
 * @layer zod
 * @responsibility Membership API contract schemas
 */

import { z } from "zod"

// ============ Role Enum ============
export const TenancyMembershipRole = z.enum(["owner", "admin", "manager", "member"])
export type TenancyMembershipRole = z.infer<typeof TenancyMembershipRole>

// ============ Membership Schemas ============

export const tenancyInviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "member"]),
  teamIds: z.array(z.string().uuid()).optional(),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
})

export const tenancyUpdateMembershipSchema = z.object({
  role: TenancyMembershipRole,
})

export const tenancyMembershipParamsSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
})

export const tenancyMembershipQuerySchema = z.object({
  role: z.enum(["owner", "admin", "member"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
})

export const tenancyMembershipResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  teamId: z.string().uuid().nullable(),
  role: z.string(),
  permissions: z.record(z.string(), z.boolean()),
  invitedBy: z.string().uuid().nullable(),
  joinedAt: z.string().datetime(),
  isActive: z.boolean(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string(),
    displayName: z.string().nullable(),
    avatar: z.string().nullable(),
  }),
  team: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),
})

// ============ Types ============
export type TenancyInviteUser = z.infer<typeof tenancyInviteUserSchema>
export type TenancyUpdateMembership = z.infer<typeof tenancyUpdateMembershipSchema>
export type TenancyMembershipParams = z.infer<typeof tenancyMembershipParamsSchema>
export type TenancyMembershipQuery = z.infer<typeof tenancyMembershipQuerySchema>
export type TenancyMembershipResponse = z.infer<typeof tenancyMembershipResponseSchema>
