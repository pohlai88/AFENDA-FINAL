/**
 * @domain tenancy
 * @layer constant
 * @responsibility Tenancy domain constants
 */

/**
 * Organization-related constants
 */
export const TENANCY_ORGANIZATION = {
  /** Maximum length for organization name */
  MAX_NAME_LENGTH: 255,
  /** Maximum length for organization slug */
  MAX_SLUG_LENGTH: 100,
  /** Maximum length for organization description */
  MAX_DESCRIPTION_LENGTH: 1000,
  
  /** Organization roles */
  ROLES: {
    /** Organization owner - full control */
    OWNER: "owner",
    /** Organization admin - management access */
    ADMIN: "admin",
    /** Organization member - basic access */
    MEMBER: "member",
  },
  
  /** Default role for new members */
  DEFAULT_ROLE: "member" as const,
} as const

export type TenancyOrganizationRoleKey = keyof typeof TENANCY_ORGANIZATION.ROLES
export type TenancyOrganizationRoleValue = (typeof TENANCY_ORGANIZATION.ROLES)[TenancyOrganizationRoleKey]

/**
 * Team-related constants
 */
export const TENANCY_TEAM = {
  /** Maximum length for team name */
  MAX_NAME_LENGTH: 255,
  /** Maximum length for team slug */
  MAX_SLUG_LENGTH: 100,
  /** Maximum length for team description */
  MAX_DESCRIPTION_LENGTH: 1000,
  
  /** Team roles */
  ROLES: {
    /** Team manager - full team control */
    MANAGER: "manager",
    /** Team member - basic team access */
    MEMBER: "member",
  },
} as const

export type TenancyTeamRoleKey = keyof typeof TENANCY_TEAM.ROLES
export type TenancyTeamRoleValue = (typeof TENANCY_TEAM.ROLES)[TenancyTeamRoleKey]

/**
 * Permission constants following hybrid methodology
 * (Focalboard + Mattermost + Nextcloud)
 */
export const TENANCY_PERMISSIONS = {
  // System permissions
  /** Full system administration access */
  SYSTEM_ADMIN: "system:admin",
  /** Manage system users */
  SYSTEM_USER_MANAGE: "system:user:manage",
  
  // Organization permissions
  /** Create new organizations */
  ORG_CREATE: "organization:create",
  /** View organization details */
  ORG_READ: "organization:read",
  /** Update organization settings */
  ORG_UPDATE: "organization:update",
  /** Delete organization */
  ORG_DELETE: "organization:delete",
  /** Full organization management */
  ORG_MANAGE: "organization:manage",
  /** Invite members to organization */
  ORG_MEMBER_INVITE: "organization:member:invite",
  /** Manage organization members */
  ORG_MEMBER_MANAGE: "organization:member:manage",
  /** Remove members from organization */
  ORG_MEMBER_REMOVE: "organization:member:remove",
  /** Create teams in organization */
  ORG_TEAM_CREATE: "organization:team:create",
  /** Manage organization teams */
  ORG_TEAM_MANAGE: "organization:team:manage",
  /** Manage organization settings */
  ORG_SETTINGS_MANAGE: "organization:settings:manage",
  
  // Team permissions
  /** Create new teams */
  TEAM_CREATE: "team:create",
  /** View team details */
  TEAM_READ: "team:read",
  /** Update team settings */
  TEAM_UPDATE: "team:update",
  /** Delete team */
  TEAM_DELETE: "team:delete",
  /** Full team management */
  TEAM_MANAGE: "team:manage",
  /** Invite members to team */
  TEAM_MEMBER_INVITE: "team:member:invite",
  /** Manage team members */
  TEAM_MEMBER_MANAGE: "team:member:manage",
  /** Remove members from team */
  TEAM_MEMBER_REMOVE: "team:member:remove",
  /** Manage team settings */
  TEAM_SETTINGS_MANAGE: "team:settings:manage",
  
  // Resource permissions
  /** View shared resources */
  SHARE_READ: "share:read",
  /** Edit shared resources */
  SHARE_WRITE: "share:write",
  /** Manage resource sharing */
  SHARE_ADMIN: "share:admin",
} as const

export type TenancyPermissionKey = keyof typeof TENANCY_PERMISSIONS
export type TenancyPermissionValue = (typeof TENANCY_PERMISSIONS)[TenancyPermissionKey]

/**
 * Resource sharing constants
 */
export const TENANCY_RESOURCE_SHARING = {
  /** Valid resource types for sharing */
  RESOURCE_TYPES: {
    PROJECT: "project",
    TASK: "task",
  },
  
  /** Valid target types for sharing */
  TARGET_TYPES: {
    USER: "user",
    TEAM: "team",
    ORGANIZATION: "organization",
  },
} as const

export type TenancyResourceTypeKey = keyof typeof TENANCY_RESOURCE_SHARING.RESOURCE_TYPES
export type TenancyResourceTypeValue = (typeof TENANCY_RESOURCE_SHARING.RESOURCE_TYPES)[TenancyResourceTypeKey]
export type TenancyTargetTypeKey = keyof typeof TENANCY_RESOURCE_SHARING.TARGET_TYPES
export type TenancyTargetTypeValue = (typeof TENANCY_RESOURCE_SHARING.TARGET_TYPES)[TenancyTargetTypeKey]

/**
 * Combined tenancy constants
 */
export const TENANCY_CONSTANTS = {
  ORGANIZATION: TENANCY_ORGANIZATION,
  TEAM: TENANCY_TEAM,
  PERMISSIONS: TENANCY_PERMISSIONS,
  RESOURCE_SHARING: TENANCY_RESOURCE_SHARING,
} as const
