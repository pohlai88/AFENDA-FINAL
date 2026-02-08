/**
 * @domain tenancy
 * @layer zod
 * @responsibility Membership API contract schemas
 */

import { z } from "zod";

export const TenancyMembershipRole = z.enum(["owner", "admin", "manager", "member"]);
export type TenancyMembershipRole = z.infer<typeof TenancyMembershipRole>;

export const tenancyInviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "member"]),
  teamIds: z.array(z.string()).optional(),
  message: z.string().max(500).optional(),
});

/** Standalone team invite (future-ready) */
export const tenancyInviteToTeamSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["lead", "member"]).default("member"),
  teamId: z.string().min(1, "Team ID is required"),
  message: z.string().max(500).optional(),
});

export type TenancyInviteToTeam = z.infer<typeof tenancyInviteToTeamSchema>;

export const tenancyUpdateMembershipSchema = z.object({
  role: TenancyMembershipRole,
});

export const tenancyMembershipParamsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const tenancyMembershipQuerySchema = z.object({
  role: z.enum(["owner", "admin", "member"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const tenancyMembershipResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string().nullable(),
  teamId: z.string().nullable(),
  role: z.string(),
  permissions: z.record(z.string(), z.boolean()),
  invitedBy: z.string().nullable(),
  joinedAt: z.string().datetime(),
  isActive: z.boolean(),
});

/** List item includes orgName/teamName from joins (BFF list endpoint) */
export const tenancyMembershipListItemSchema =
  tenancyMembershipResponseSchema.extend({
    orgName: z.string().nullable().optional(),
    teamName: z.string().nullable().optional(),
  });

/** BFF list response: GET /api/tenancy/memberships/bff */
export const tenancyMembershipListResponseSchema = z.object({
  items: z.array(tenancyMembershipListItemSchema),
  total: z.number(),
});

export type TenancyInviteUser = z.infer<typeof tenancyInviteUserSchema>;
export type TenancyUpdateMembership = z.infer<typeof tenancyUpdateMembershipSchema>;
export type TenancyMembershipParams = z.infer<typeof tenancyMembershipParamsSchema>;
export type TenancyMembershipQuery = z.infer<typeof tenancyMembershipQuerySchema>;
export const tenancyCreateTeamMembershipSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["lead", "member"]).default("member"),
});

export type TenancyCreateTeamMembership = z.infer<
  typeof tenancyCreateTeamMembershipSchema
>;
export type TenancyMembershipResponse = z.infer<
  typeof tenancyMembershipResponseSchema
>;
export type TenancyMembershipListItem = z.infer<
  typeof tenancyMembershipListItemSchema
>;
export type TenancyMembershipListResponse = z.infer<
  typeof tenancyMembershipListResponseSchema
>;
