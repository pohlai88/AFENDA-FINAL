/**
 * @deprecated Use @afenda/tenancy/zod instead
 * This file is a shim for backward compatibility during migration.
 */
import {
  // Organization schemas
  tenancyCreateOrganizationSchema,
  tenancyUpdateOrganizationSchema,
  tenancyOrganizationParamsSchema,
  tenancyOrganizationQuerySchema,
  tenancyOrganizationResponseSchema,
  // Team schemas
  tenancyCreateTeamSchema,
  tenancyUpdateTeamSchema,
  tenancyTeamParamsSchema,
  tenancyTeamQuerySchema,
  tenancyTeamResponseSchema,
  // Membership schemas
  tenancyInviteUserSchema,
  tenancyUpdateMembershipSchema,
  tenancyMembershipParamsSchema,
  tenancyMembershipQuerySchema,
  tenancyMembershipResponseSchema,
  // Sharing schemas
  tenancyShareResourceSchema,
  tenancyUpdateShareSchema,
  tenancyShareParamsSchema,
  tenancyShareQuerySchema,
  tenancyShareResponseSchema,
  // Permission schema
  tenancyCheckPermissionSchema,
  tenancyPermissionCheckResponseSchema,
  // Types
  type TenancyCreateOrganization,
  type TenancyUpdateOrganization,
  type TenancyOrganizationParams,
  type TenancyOrganizationQuery,
  type TenancyOrganizationResponse,
  type TenancyCreateTeam,
  type TenancyUpdateTeam,
  type TenancyTeamParams,
  type TenancyTeamQuery,
  type TenancyTeamResponse,
  type TenancyInviteUser,
  type TenancyUpdateMembership,
  type TenancyMembershipParams,
  type TenancyMembershipQuery,
  type TenancyMembershipResponse,
  type TenancyShareResource,
  type TenancyUpdateShare,
  type TenancyShareParams,
  type TenancyShareQuery,
  type TenancyCheckPermission,
  type TenancyShareResponse,
  type TenancyPermissionCheckResponse,
} from "@afenda/tenancy/zod"

// Re-export with legacy names
export const createOrganizationSchema = tenancyCreateOrganizationSchema
export const updateOrganizationSchema = tenancyUpdateOrganizationSchema
export const organizationParamsSchema = tenancyOrganizationParamsSchema
export const organizationQuerySchema = tenancyOrganizationQuerySchema
export const organizationResponseSchema = tenancyOrganizationResponseSchema

export const createTeamSchema = tenancyCreateTeamSchema
export const updateTeamSchema = tenancyUpdateTeamSchema
export const teamParamsSchema = tenancyTeamParamsSchema
export const teamQuerySchema = tenancyTeamQuerySchema
export const teamResponseSchema = tenancyTeamResponseSchema

export const inviteUserSchema = tenancyInviteUserSchema
export const updateMembershipSchema = tenancyUpdateMembershipSchema
export const membershipParamsSchema = tenancyMembershipParamsSchema
export const membershipQuerySchema = tenancyMembershipQuerySchema
export const membershipResponseSchema = tenancyMembershipResponseSchema

export const shareResourceSchema = tenancyShareResourceSchema
export const updateShareSchema = tenancyUpdateShareSchema
export const shareParamsSchema = tenancyShareParamsSchema
export const shareQuerySchema = tenancyShareQuerySchema
export const shareResponseSchema = tenancyShareResponseSchema

export const checkPermissionSchema = tenancyCheckPermissionSchema
export const permissionCheckResponseSchema = tenancyPermissionCheckResponseSchema

// Re-export types
export type {
  TenancyCreateOrganization,
  TenancyUpdateOrganization,
  TenancyOrganizationParams,
  TenancyOrganizationQuery,
  TenancyOrganizationResponse,
  TenancyCreateTeam,
  TenancyUpdateTeam,
  TenancyTeamParams,
  TenancyTeamQuery,
  TenancyTeamResponse,
  TenancyInviteUser,
  TenancyUpdateMembership,
  TenancyMembershipParams,
  TenancyMembershipQuery,
  TenancyMembershipResponse,
  TenancyShareResource,
  TenancyUpdateShare,
  TenancyShareParams,
  TenancyShareQuery,
  TenancyCheckPermission,
  TenancyShareResponse,
  TenancyPermissionCheckResponse,
}

// Legacy type aliases (use Tenancy* types directly from @afenda/tenancy/zod)
export type CreateOrganizationInput = TenancyCreateOrganization
export type UpdateOrganizationInput = TenancyUpdateOrganization
export type OrganizationParams = TenancyOrganizationParams
export interface OrganizationQuery {
  page: number
  limit: number
  search?: string
  role?: string
}

export type CreateTeamInput = TenancyCreateTeam
export type UpdateTeamInput = TenancyUpdateTeam
export type TeamParams = TenancyTeamParams
export interface TeamQuery {
  page: number
  limit: number
  search?: string
  role?: string
}

export type InviteUserInput = TenancyInviteUser
export type UpdateMembershipInput = TenancyUpdateMembership
export type MembershipParams = TenancyMembershipParams
export type MembershipQuery = TenancyMembershipQuery

export type ShareResourceInput = TenancyShareResource
export type UpdateShareInput = TenancyUpdateShare
export type ShareParams = TenancyShareParams
export type ShareQuery = TenancyShareQuery

export type CheckPermissionInput = TenancyCheckPermission

export type OrganizationResponse = TenancyOrganizationResponse
export type TeamResponse = TenancyTeamResponse
export type MembershipResponse = TenancyMembershipResponse
export type ShareResponse = TenancyShareResponse
export type PermissionCheckResponse = TenancyPermissionCheckResponse
