import "@afenda/shared/server/only"
import { PERMISSIONS, type PermissionValue } from "@afenda/shared/constants"
import { getDb, memberships, resourceShares, type Db } from "@afenda/shared/db"
import { eq, and } from "drizzle-orm"
import { logger } from "@afenda/shared/logger"
import {
  BASE_USER_PERMISSIONS,
  getOrganizationRolePermissions,
  getTeamRolePermissions,
  isValidOrganizationRole,
  isValidTeamRole,
} from "./roles"

/**
 * Permission service for calculating and checking user permissions
 * following the hybrid methodology (Focalboard + Mattermost + Nextcloud)
 */
export class PermissionService {
  /**
   * Calculate all permissions for a user in a given context
   */
  async calculatePermissions(context: {
    userId: string
    organizationId?: string
    teamId?: string
    resourceId?: string
    resourceType?: string
  }, db?: Db): Promise<Set<string>> {
    const permissions = new Set<string>()

    // 1. Base permissions - everyone gets basic permissions (Focalboard-inspired)
    BASE_USER_PERMISSIONS.forEach(p => permissions.add(p))

    // 2. Add organization-specific permissions if in org context
    if (context.organizationId) {
      const orgPermissions = await this.getOrganizationPermissions(
        context.userId,
        context.organizationId
        ,
        db
      )
      orgPermissions.forEach(p => permissions.add(p))
    }

    // 3. Add team-specific permissions if in team context
    if (context.teamId) {
      const teamPermissions = await this.getTeamPermissions(
        context.userId,
        context.teamId
        ,
        db
      )
      teamPermissions.forEach(p => permissions.add(p))
    }

    // 4. Add resource-specific permissions from shares
    if (context.resourceId && context.resourceType) {
      const sharePermissions = await this.getSharePermissions(
        context.userId,
        context.resourceId,
        context.resourceType
        ,
        db
      )
      sharePermissions.forEach(p => permissions.add(p))
    }

    return permissions
  }

  /**
   * Check if a user has a specific permission in a given context
   */
  async hasPermission(
    userId: string,
    permission: PermissionValue,
    context?: {
      organizationId?: string
      teamId?: string
      resourceId?: string
      resourceType?: string
    },
    db?: Db
  ): Promise<boolean> {
    const permissions = await this.calculatePermissions({
      userId,
      ...context
    }, db)

    return permissions.has(permission)
  }

  /**
   * Get organization permissions based on membership role
   */
  private async getOrganizationPermissions(
    userId: string,
    organizationId: string
  , db?: Db): Promise<string[]> {
    try {
      const dbx = db ?? getDb()
      // Query membership
      const [membership] = await dbx
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, userId),
            eq(memberships.organizationId, organizationId),
            eq(memberships.isActive, true)
          )
        )
        .limit(1)

      if (!membership) {
        return []
      }

      // Get role-based permissions from mapping
      const rolePermissions = getOrganizationRolePermissions(membership.role)
      const permissions: string[] = [...rolePermissions]

      // Validate role
      if (!isValidOrganizationRole(membership.role)) {
        logger.warn({ userId, organizationId, role: membership.role }, "Invalid organization role")
        return []
      }

      // Add explicit permission overrides from membership.permissions JSONB
      if (membership.permissions && typeof membership.permissions === 'object') {
        const explicitPerms = membership.permissions as Record<string, boolean>
        Object.entries(explicitPerms).forEach(([perm, granted]) => {
          if (granted && !permissions.includes(perm)) {
            permissions.push(perm)
          }
        })
      }

      return permissions
    } catch (error) {
      logger.error({ error, userId, organizationId }, "Error getting organization permissions")
      return []
    }
  }

  /**
   * Get team permissions based on membership role
   */
  private async getTeamPermissions(
    userId: string,
    teamId: string
  , db?: Db): Promise<string[]> {
    try {
      const dbx = db ?? getDb()
      // Query team membership
      const [membership] = await dbx
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, userId),
            eq(memberships.teamId, teamId),
            eq(memberships.isActive, true)
          )
        )
        .limit(1)

      if (!membership) {
        return []
      }

      // Get role-based permissions from mapping
      const rolePermissions = getTeamRolePermissions(membership.role)
      const permissions: string[] = [...rolePermissions]

      // Validate role
      if (!isValidTeamRole(membership.role)) {
        logger.warn({ userId, teamId, role: membership.role }, "Invalid team role")
        return []
      }

      // Add explicit permission overrides
      if (membership.permissions && typeof membership.permissions === 'object') {
        const explicitPerms = membership.permissions as Record<string, boolean>
        Object.entries(explicitPerms).forEach(([perm, granted]) => {
          if (granted && !permissions.includes(perm)) {
            permissions.push(perm)
          }
        })
      }

      return permissions
    } catch (error) {
      logger.error({ error, userId, teamId }, "Error getting team permissions")
      return []
    }
  }

  /**
   * Get permissions from resource shares (Nextcloud-style cross-boundary sharing)
   */
  private async getSharePermissions(
    userId: string,
    resourceId: string,
    resourceType: string
  , db?: Db): Promise<string[]> {
    try {
      const dbx = db ?? getDb()
      const permissions: string[] = []

      // Query direct user shares
      const userShares = await dbx
        .select()
        .from(resourceShares)
        .where(
          and(
            eq(resourceShares.resourceId, resourceId),
            eq(resourceShares.resourceType, resourceType),
            eq(resourceShares.sharedWithUserId, userId)
          )
        )

      // Add permissions from direct shares
      userShares.forEach(share => {
        if (share.permissions && typeof share.permissions === 'object') {
          const sharePerms = share.permissions as Record<string, boolean>
          Object.entries(sharePerms).forEach(([perm, granted]) => {
            if (granted && !permissions.includes(perm)) {
              permissions.push(perm)
            }
          })
        }
      })

      // Query team shares
      const userTeams = await dbx
        .select({ teamId: memberships.teamId })
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, userId),
            eq(memberships.isActive, true)
          )
        )

      if (userTeams.length > 0) {
        const teamIds = userTeams.map(t => t.teamId).filter((id): id is string => id !== null)

        if (teamIds.length > 0) {
          const teamShares = await dbx
            .select()
            .from(resourceShares)
            .where(
              and(
                eq(resourceShares.resourceId, resourceId),
                eq(resourceShares.resourceType, resourceType)
              )
            )

          teamShares.forEach(share => {
            if (share.sharedWithTeamId && teamIds.includes(share.sharedWithTeamId) && share.permissions && typeof share.permissions === 'object') {
              const sharePerms = share.permissions as Record<string, boolean>
              Object.entries(sharePerms).forEach(([perm, granted]) => {
                if (granted && !permissions.includes(perm)) {
                  permissions.push(perm)
                }
              })
            }
          })
        }
      }

      // Query organization shares
      const userOrgs = await dbx
        .select({ organizationId: memberships.organizationId })
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, userId),
            eq(memberships.isActive, true)
          )
        )

      if (userOrgs.length > 0) {
        const orgIds = userOrgs.map(o => o.organizationId).filter((id): id is string => id !== null)

        if (orgIds.length > 0) {
          const orgShares = await dbx
            .select()
            .from(resourceShares)
            .where(
              and(
                eq(resourceShares.resourceId, resourceId),
                eq(resourceShares.resourceType, resourceType)
              )
            )

          orgShares.forEach(share => {
            if (share.sharedWithOrganizationId && orgIds.includes(share.sharedWithOrganizationId) && share.permissions && typeof share.permissions === 'object') {
              const sharePerms = share.permissions as Record<string, boolean>
              Object.entries(sharePerms).forEach(([perm, granted]) => {
                if (granted && !permissions.includes(perm)) {
                  permissions.push(perm)
                }
              })
            }
          })
        }
      }

      return permissions
    } catch (error) {
      logger.error({ error, userId, resourceId, resourceType }, "Error getting share permissions")
      return []
    }
  }

  /**
   * Check if user can access a resource (read access)
   */
  async canAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    context?: {
      organizationId?: string
      teamId?: string
    },
    db?: Db
  ): Promise<boolean> {
    // Owner always has access
    // TODO: Check if user is the owner

    // Check shared permissions
    const hasShareAccess = await this.hasPermission(
      userId,
      PERMISSIONS.SHARE_READ,
      {
        resourceId,
        resourceType,
        ...context
      },
      db
    )

    if (hasShareAccess) return true

    // Check organization/team access
    if (context?.organizationId) {
      const hasOrgAccess = await this.hasPermission(
        userId,
        PERMISSIONS.ORG_READ,
        context,
        db
      )
      if (hasOrgAccess) return true
    }

    return false
  }

  /**
   * Check if user can modify a resource (write access)
   */
  async canModify(
    userId: string,
    resourceType: string,
    resourceId: string,
    context?: {
      organizationId?: string
      teamId?: string
    },
    db?: Db
  ): Promise<boolean> {
    // Owner always has access
    // TODO: Check if user is the owner

    // Check shared permissions
    const hasShareAccess = await this.hasPermission(
      userId,
      PERMISSIONS.SHARE_WRITE,
      {
        resourceId,
        resourceType,
        ...context
      },
      db
    )

    if (hasShareAccess) return true

    // Check organization/team admin permissions
    if (context?.organizationId) {
      const hasOrgAccess = await this.hasPermission(
        userId,
        PERMISSIONS.ORG_MEMBER_MANAGE,
        context,
        db
      )
      if (hasOrgAccess) return true
    }

    if (context?.teamId) {
      const hasTeamAccess = await this.hasPermission(
        userId,
        PERMISSIONS.TEAM_MANAGE,
        context,
        db
      )
      if (hasTeamAccess) return true
    }

    return false
  }
}

// Singleton instance
export const permissionService = new PermissionService()
