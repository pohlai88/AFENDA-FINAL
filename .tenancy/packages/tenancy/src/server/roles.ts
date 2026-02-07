import "@afenda/shared/server/only"
import { PERMISSIONS, ORGANIZATION, TEAM, type PermissionValue } from "@afenda/shared/constants"

/**
 * Role-based permission mappings following the hybrid methodology
 * (Mattermost's role hierarchy + Nextcloud's flexibility)
 */

/**
 * Organization role permission mappings
 */
export const ORGANIZATION_ROLE_PERMISSIONS: Record<string, PermissionValue[]> = {
  [ORGANIZATION.ROLES.OWNER]: [
    // Full organization control
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_UPDATE,
    PERMISSIONS.ORG_DELETE,
    PERMISSIONS.ORG_MANAGE,
    PERMISSIONS.ORG_SETTINGS_MANAGE,
    
    // Member management
    PERMISSIONS.ORG_MEMBER_INVITE,
    PERMISSIONS.ORG_MEMBER_MANAGE,
    PERMISSIONS.ORG_MEMBER_REMOVE,
    
    // Team management
    PERMISSIONS.ORG_TEAM_CREATE,
    PERMISSIONS.ORG_TEAM_MANAGE,
    PERMISSIONS.TEAM_CREATE,
    PERMISSIONS.TEAM_READ,
    PERMISSIONS.TEAM_UPDATE,
    PERMISSIONS.TEAM_DELETE,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.TEAM_MEMBER_INVITE,
    PERMISSIONS.TEAM_MEMBER_MANAGE,
    PERMISSIONS.TEAM_MEMBER_REMOVE,
    PERMISSIONS.TEAM_SETTINGS_MANAGE,
    
    // Resource permissions
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.PROJECT_SHARE,
    PERMISSIONS.PROJECT_ADMIN,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_COMMENT,
  ],
  
  [ORGANIZATION.ROLES.ADMIN]: [
    // Organization read access
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_UPDATE,
    
    // Member management
    PERMISSIONS.ORG_MEMBER_INVITE,
    PERMISSIONS.ORG_MEMBER_MANAGE,
    PERMISSIONS.ORG_MEMBER_REMOVE,
    
    // Team management
    PERMISSIONS.ORG_TEAM_CREATE,
    PERMISSIONS.ORG_TEAM_MANAGE,
    PERMISSIONS.TEAM_CREATE,
    PERMISSIONS.TEAM_READ,
    PERMISSIONS.TEAM_UPDATE,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.TEAM_MEMBER_INVITE,
    PERMISSIONS.TEAM_MEMBER_MANAGE,
    PERMISSIONS.TEAM_MEMBER_REMOVE,
    PERMISSIONS.TEAM_SETTINGS_MANAGE,
    
    // Resource permissions
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.PROJECT_SHARE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_COMMENT,
  ],
  
  [ORGANIZATION.ROLES.MEMBER]: [
    // Basic organization access
    PERMISSIONS.ORG_READ,
    
    // Team access
    PERMISSIONS.TEAM_CREATE,
    PERMISSIONS.TEAM_READ,
    
    // Resource permissions
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_SHARE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_COMMENT,
  ],
}

/**
 * Team role permission mappings
 */
export const TEAM_ROLE_PERMISSIONS: Record<string, PermissionValue[]> = {
  [TEAM.ROLES.MANAGER]: [
    // Full team control
    PERMISSIONS.TEAM_READ,
    PERMISSIONS.TEAM_UPDATE,
    PERMISSIONS.TEAM_DELETE,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.TEAM_SETTINGS_MANAGE,
    
    // Member management
    PERMISSIONS.TEAM_MEMBER_INVITE,
    PERMISSIONS.TEAM_MEMBER_MANAGE,
    PERMISSIONS.TEAM_MEMBER_REMOVE,
    
    // Resource permissions
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.PROJECT_SHARE,
    PERMISSIONS.PROJECT_ADMIN,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_COMMENT,
  ],
  
  [TEAM.ROLES.MEMBER]: [
    // Basic team access
    PERMISSIONS.TEAM_READ,
    
    // Resource permissions
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_SHARE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_COMMENT,
  ],
}

/**
 * Base permissions that all authenticated users have
 * (Focalboard-inspired: everyone starts with basics)
 */
export const BASE_USER_PERMISSIONS: PermissionValue[] = [
  PERMISSIONS.PROJECT_CREATE,
  PERMISSIONS.PROJECT_READ,
  PERMISSIONS.TASK_CREATE,
  PERMISSIONS.TASK_READ,
  PERMISSIONS.TASK_UPDATE,
  PERMISSIONS.TASK_COMMENT,
]

/**
 * Get permissions for an organization role
 */
export function getOrganizationRolePermissions(role: string): PermissionValue[] {
  return ORGANIZATION_ROLE_PERMISSIONS[role] || []
}

/**
 * Get permissions for a team role
 */
export function getTeamRolePermissions(role: string): PermissionValue[] {
  return TEAM_ROLE_PERMISSIONS[role] || []
}

/**
 * Check if a role is valid for organizations
 */
export function isValidOrganizationRole(role: string): boolean {
  return role in ORGANIZATION_ROLE_PERMISSIONS
}

/**
 * Check if a role is valid for teams
 */
export function isValidTeamRole(role: string): boolean {
  return role in TEAM_ROLE_PERMISSIONS
}

/**
 * Get all valid organization roles
 */
export function getValidOrganizationRoles(): string[] {
  return Object.keys(ORGANIZATION_ROLE_PERMISSIONS)
}

/**
 * Get all valid team roles
 */
export function getValidTeamRoles(): string[] {
  return Object.keys(TEAM_ROLE_PERMISSIONS)
}

/**
 * Role hierarchy levels (higher number = more permissions)
 * Used for role comparison and inheritance
 */
export const ORGANIZATION_ROLE_HIERARCHY: Record<string, number> = {
  [ORGANIZATION.ROLES.MEMBER]: 1,
  [ORGANIZATION.ROLES.ADMIN]: 2,
  [ORGANIZATION.ROLES.OWNER]: 3,
}

export const TEAM_ROLE_HIERARCHY: Record<string, number> = {
  [TEAM.ROLES.MEMBER]: 1,
  [TEAM.ROLES.MANAGER]: 2,
}

/**
 * Check if roleA has higher or equal hierarchy than roleB in organization context
 */
export function hasHigherOrEqualOrgRole(roleA: string, roleB: string): boolean {
  const levelA = ORGANIZATION_ROLE_HIERARCHY[roleA] || 0
  const levelB = ORGANIZATION_ROLE_HIERARCHY[roleB] || 0
  return levelA >= levelB
}

/**
 * Check if roleA has higher or equal hierarchy than roleB in team context
 */
export function hasHigherOrEqualTeamRole(roleA: string, roleB: string): boolean {
  const levelA = TEAM_ROLE_HIERARCHY[roleA] || 0
  const levelB = TEAM_ROLE_HIERARCHY[roleB] || 0
  return levelA >= levelB
}

/**
 * Permission categories for UI grouping
 */
export const PERMISSION_CATEGORIES = {
  SYSTEM: "System",
  ORGANIZATION: "Organization",
  TEAM: "Team",
  PROJECT: "Project",
  TASK: "Task",
  SHARING: "Sharing",
} as const

/**
 * Get permission category from permission string
 */
export function getPermissionCategory(permission: PermissionValue): string {
  const prefix = permission.split(":")[0]
  
  switch (prefix) {
    case "system":
      return PERMISSION_CATEGORIES.SYSTEM
    case "organization":
      return PERMISSION_CATEGORIES.ORGANIZATION
    case "team":
      return PERMISSION_CATEGORIES.TEAM
    case "project":
      return PERMISSION_CATEGORIES.PROJECT
    case "task":
      return PERMISSION_CATEGORIES.TASK
    case "share":
      return PERMISSION_CATEGORIES.SHARING
    default:
      return "Other"
  }
}

/**
 * Human-readable permission descriptions
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // System
  [PERMISSIONS.SYSTEM_ADMIN]: "Full system administration access",
  [PERMISSIONS.SYSTEM_USER_MANAGE]: "Manage system users",
  
  // Organization
  [PERMISSIONS.ORG_CREATE]: "Create new organizations",
  [PERMISSIONS.ORG_READ]: "View organization details",
  [PERMISSIONS.ORG_UPDATE]: "Update organization settings",
  [PERMISSIONS.ORG_DELETE]: "Delete organization",
  [PERMISSIONS.ORG_MANAGE]: "Full organization management",
  [PERMISSIONS.ORG_MEMBER_INVITE]: "Invite members to organization",
  [PERMISSIONS.ORG_MEMBER_MANAGE]: "Manage organization members",
  [PERMISSIONS.ORG_MEMBER_REMOVE]: "Remove members from organization",
  [PERMISSIONS.ORG_TEAM_CREATE]: "Create teams in organization",
  [PERMISSIONS.ORG_TEAM_MANAGE]: "Manage organization teams",
  [PERMISSIONS.ORG_SETTINGS_MANAGE]: "Manage organization settings",
  
  // Team
  [PERMISSIONS.TEAM_CREATE]: "Create new teams",
  [PERMISSIONS.TEAM_READ]: "View team details",
  [PERMISSIONS.TEAM_UPDATE]: "Update team settings",
  [PERMISSIONS.TEAM_DELETE]: "Delete team",
  [PERMISSIONS.TEAM_MANAGE]: "Full team management",
  [PERMISSIONS.TEAM_MEMBER_INVITE]: "Invite members to team",
  [PERMISSIONS.TEAM_MEMBER_MANAGE]: "Manage team members",
  [PERMISSIONS.TEAM_MEMBER_REMOVE]: "Remove members from team",
  [PERMISSIONS.TEAM_SETTINGS_MANAGE]: "Manage team settings",
  
  // Project
  [PERMISSIONS.PROJECT_CREATE]: "Create new projects",
  [PERMISSIONS.PROJECT_READ]: "View projects",
  [PERMISSIONS.PROJECT_UPDATE]: "Update projects",
  [PERMISSIONS.PROJECT_DELETE]: "Delete projects",
  [PERMISSIONS.PROJECT_SHARE]: "Share projects with others",
  [PERMISSIONS.PROJECT_ADMIN]: "Full project administration",
  
  // Task
  [PERMISSIONS.TASK_CREATE]: "Create new tasks",
  [PERMISSIONS.TASK_READ]: "View tasks",
  [PERMISSIONS.TASK_UPDATE]: "Update tasks",
  [PERMISSIONS.TASK_DELETE]: "Delete tasks",
  [PERMISSIONS.TASK_ASSIGN]: "Assign tasks to users",
  [PERMISSIONS.TASK_COMMENT]: "Comment on tasks",
  
  // Sharing
  [PERMISSIONS.SHARE_READ]: "View shared resources",
  [PERMISSIONS.SHARE_WRITE]: "Edit shared resources",
  [PERMISSIONS.SHARE_ADMIN]: "Manage resource sharing",
}

/**
 * Get human-readable description for a permission
 */
export function getPermissionDescription(permission: PermissionValue): string {
  return PERMISSION_DESCRIPTIONS[permission] || "Unknown permission"
}
