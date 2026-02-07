import "@afenda/shared/server/only"
import { HttpError } from "@afenda/shared/server/errors"
import { permissionService } from "./service"
import type { PermissionValue } from "@afenda/shared/constants"
import { getTenancyFromRequest } from "@afenda/tenancy/zod"
import { getAuthContext } from "@afenda/auth/server"
import { withRlsDb } from "@afenda/shared/db"

/**
 * Create a middleware that checks for a specific permission
 */
export function requirePermission(permission: PermissionValue) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: Request, context?: { params?: any }) => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const tenancy = getTenancyFromRequest(Object.fromEntries(req.headers.entries()))

    const hasPermission = await withRlsDb(auth.userId, async (db) =>
      permissionService.hasPermission(
        auth.userId,
        permission,
        {
          organizationId: tenancy.orgId,
          teamId: tenancy.teamId,
          resourceId: context?.params?.id,
          resourceType: getResourceTypeFromUrl(req.url),
        },
        db
      )
    )

    if (!hasPermission) {
      throw new HttpError(403, "FORBIDDEN", "Insufficient permissions")
    }

    return true
  }
}

/**
 * Create a middleware that checks if user can read a resource
 */
export function requireReadAccess(resourceType: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: Request, context?: { params?: any }) => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const resourceId = context?.params?.id
    if (!resourceId) {
      throw new HttpError(400, "BAD_REQUEST", "Resource ID is required")
    }

    const tenancy = getTenancyFromRequest(Object.fromEntries(req.headers.entries()))

    const canAccess = await withRlsDb(auth.userId, async (db) =>
      permissionService.canAccess(
        auth.userId,
        resourceType,
        resourceId,
        {
          organizationId: tenancy.orgId,
          teamId: tenancy.teamId,
        },
        db
      )
    )

    if (!canAccess) {
      throw new HttpError(403, "FORBIDDEN", "Access denied")
    }

    return true
  }
}

/**
 * Create a middleware that checks if user can modify a resource
 */
export function requireWriteAccess(resourceType: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: Request, context?: { params?: any }) => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const resourceId = context?.params?.id
    if (!resourceId) {
      throw new HttpError(400, "BAD_REQUEST", "Resource ID is required")
    }

    const tenancy = getTenancyFromRequest(Object.fromEntries(req.headers.entries()))

    const canModify = await withRlsDb(auth.userId, async (db) =>
      permissionService.canModify(
        auth.userId,
        resourceType,
        resourceId,
        {
          organizationId: tenancy.orgId,
          teamId: tenancy.teamId,
        },
        db
      )
    )

    if (!canModify) {
      throw new HttpError(403, "FORBIDDEN", "Access denied")
    }

    return true
  }
}

/**
 * Create a middleware that checks if user is organization member
 */
export function requireOrganizationMember() {
  return async (req: Request) => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const tenancy = getTenancyFromRequest(Object.fromEntries(req.headers.entries()))

    if (!tenancy.orgId) {
      throw new HttpError(400, "BAD_REQUEST", "Organization ID is required")
    }

    const isMember = await withRlsDb(auth.userId, async (db) =>
      permissionService.hasPermission(
        auth.userId,
        "organization:read" as PermissionValue,
        { organizationId: tenancy.orgId },
        db
      )
    )

    if (!isMember) {
      throw new HttpError(403, "FORBIDDEN", "Organization membership required")
    }

    return true
  }
}

/**
 * Create a middleware that checks if user is organization admin
 */
export function requireOrganizationAdmin() {
  return async (req: Request) => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const tenancy = getTenancyFromRequest(Object.fromEntries(req.headers.entries()))

    if (!tenancy.orgId) {
      throw new HttpError(400, "BAD_REQUEST", "Organization ID is required")
    }

    const isAdmin = await withRlsDb(auth.userId, async (db) =>
      permissionService.hasPermission(
        auth.userId,
        "organization:member:manage" as PermissionValue,
        { organizationId: tenancy.orgId },
        db
      )
    )

    if (!isAdmin) {
      throw new HttpError(403, "FORBIDDEN", "Organization admin permissions required")
    }

    return true
  }
}

/**
 * Create a middleware that checks if user is team manager
 */
export function requireTeamManager() {
  return async (req: Request) => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const tenancy = getTenancyFromRequest(Object.fromEntries(req.headers.entries()))

    if (!tenancy.teamId) {
      throw new HttpError(400, "BAD_REQUEST", "Team ID is required")
    }

    const isManager = await withRlsDb(auth.userId, async (db) =>
      permissionService.hasPermission(
        auth.userId,
        "team:manage" as PermissionValue,
        {
          organizationId: tenancy.orgId,
          teamId: tenancy.teamId,
        },
        db
      )
    )

    if (!isManager) {
      throw new HttpError(403, "FORBIDDEN", "Team manager permissions required")
    }

    return true
  }
}

/**
 * Helper function to extract resource type from URL
 */
function getResourceTypeFromUrl(url?: string): string | undefined {
  if (!url) return undefined

  const pathname = new URL(url).pathname

  if (pathname.includes("/projects")) {
    return "project"
  }

  if (pathname.includes("/tasks")) {
    return "task"
  }

  if (pathname.includes("/organizations")) {
    return "organization"
  }

  if (pathname.includes("/teams")) {
    return "team"
  }

  return undefined
}
