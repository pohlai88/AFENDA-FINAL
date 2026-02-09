/**
 * @domain tenancy
 * @layer server
 * @responsibility Authorization middleware for API routes
 * Phase 2, Step 2.2: HOF wrappers for role-based access control
 */

import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  kernelFail,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { envelopeHeaders } from "@afenda/shared/server";
import { assertUserHasOrgRole, assertUserHasTeamRole } from "./guard";
import type { OrgRole, TeamRole } from "./guard";

/**
 * Route handler type for API endpoints
 */
export type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Context passed to wrapped handlers
 */
export interface AuthorizedContext {
  userId: string;
  organizationId?: string;
  teamId?: string;
  params: Record<string, string>;
}

/**
 * Higher-order function that wraps route handlers with organization-level authorization
 * 
 * @param handler - The actual route handler to execute after authorization
 * @param requiredRole - Minimum role required ("owner", "admin", or "member")
 * @returns Wrapped handler with automatic authorization checks
 * 
 * @example
 * ```ts
 * export const GET = withOrgAccess(
 *   async (request, { userId, organizationId }) => {
 *     const data = await service.getData(organizationId);
 *     return NextResponse.json(kernelOk({ data }));
 *   },
 *   "member" // Any org member can access
 * );
 * ```
 */
export function withOrgAccess(
  handler: (
    request: NextRequest,
    context: AuthorizedContext
  ) => Promise<NextResponse>,
  requiredRole: OrgRole = "member"
): RouteHandler {
  return async (request, routeContext) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      // Check authentication
      const auth = await getAuthContext();
      const userId = auth.userId ?? undefined;

      if (!userId) {
        return NextResponse.json(
          kernelFail(
            {
              code: KERNEL_ERROR_CODES.UNAUTHORIZED,
              message: "Authentication required",
            },
            { traceId }
          ),
          { status: HTTP_STATUS.UNAUTHORIZED, headers: envelopeHeaders(traceId) }
        );
      }

      // Extract organizationId from route params
      const params = await routeContext.params;
      const organizationId = params.id || params.organizationId;

      if (!organizationId) {
        return NextResponse.json(
          kernelFail(
            {
              code: KERNEL_ERROR_CODES.VALIDATION,
              message: "Organization ID required",
            },
            { traceId }
          ),
          { status: HTTP_STATUS.BAD_REQUEST, headers: envelopeHeaders(traceId) }
        );
      }

      // Check authorization - throws if unauthorized
      try {
        await assertUserHasOrgRole(userId, organizationId, requiredRole);
      } catch (_authError) {
        // Return 404 instead of 403 for security by obscurity
        // (don't reveal existence of resources user can't access)
        return NextResponse.json(
          kernelFail(
            {
              code: KERNEL_ERROR_CODES.NOT_FOUND,
              message: "Organization not found",
            },
            { traceId }
          ),
          { status: HTTP_STATUS.NOT_FOUND, headers: envelopeHeaders(traceId) }
        );
      }

      // Execute the actual handler
      return await handler(request, {
        userId,
        organizationId,
        params,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: envelopeHeaders(traceId) }
      );
    }
  };
}

/**
 * Higher-order function that wraps route handlers with team-level authorization
 * 
 * @param handler - The actual route handler to execute after authorization
 * @param requiredRole - Minimum role required ("owner", "admin", or "member")
 * @returns Wrapped handler with automatic authorization checks
 * 
 * @example
 * ```ts
 * export const PATCH = withTeamAccess(
 *   async (request, { userId, teamId }) => {
 *     const body = await request.json();
 *     await service.updateTeam(teamId, body);
 *     return NextResponse.json(kernelOk({ success: true }));
 *   },
 *   "admin" // Only team admins/owners can update
 * );
 * ```
 */
export function withTeamAccess(
  handler: (
    request: NextRequest,
    context: AuthorizedContext
  ) => Promise<NextResponse>,
  requiredRole: TeamRole = "member"
): RouteHandler {
  return async (request, routeContext) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      // Check authentication
      const auth = await getAuthContext();
      const userId = auth.userId ?? undefined;

      if (!userId) {
        return NextResponse.json(
          kernelFail(
            {
              code: KERNEL_ERROR_CODES.UNAUTHORIZED,
              message: "Authentication required",
            },
            { traceId }
          ),
          { status: HTTP_STATUS.UNAUTHORIZED, headers: envelopeHeaders(traceId) }
        );
      }

      // Extract teamId from route params
      const params = await routeContext.params;
      const teamId = params.id || params.teamId;

      if (!teamId) {
        return NextResponse.json(
          kernelFail(
            {
              code: KERNEL_ERROR_CODES.VALIDATION,
              message: "Team ID required",
            },
            { traceId }
          ),
          { status: HTTP_STATUS.BAD_REQUEST, headers: envelopeHeaders(traceId) }
        );
      }

      // Check authorization - throws if unauthorized
      try {
        await assertUserHasTeamRole(userId, teamId, requiredRole);
      } catch (_authError) {
        // Return 404 instead of 403 for security by obscurity
        return NextResponse.json(
          kernelFail(
            {
              code: KERNEL_ERROR_CODES.NOT_FOUND,
              message: "Team not found",
            },
            { traceId }
          ),
          { status: HTTP_STATUS.NOT_FOUND, headers: envelopeHeaders(traceId) }
        );
      }

      // Execute the actual handler
      return await handler(request, {
        userId,
        teamId,
        params,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: envelopeHeaders(traceId) }
      );
    }
  };
}

/**
 * Higher-order function that only checks authentication (no role/membership checks)
 * Useful for endpoints that need user context but have custom authorization logic
 * 
 * @param handler - The actual route handler to execute after authentication
 * @returns Wrapped handler with automatic authentication check
 * 
 * @example
 * ```ts
 * export const GET = withAuth(
 *   async (request, { userId, params }) => {
 *     // Custom logic here
 *     return NextResponse.json(kernelOk({ userId }));
 *   }
 * );
 * ```
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: AuthorizedContext
  ) => Promise<NextResponse>
): RouteHandler {
  return async (request, routeContext) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      const auth = await getAuthContext();
      const userId = auth.userId ?? undefined;

      if (!userId) {
        return NextResponse.json(
          kernelFail(
            {
              code: KERNEL_ERROR_CODES.UNAUTHORIZED,
              message: "Authentication required",
            },
            { traceId }
          ),
          { status: HTTP_STATUS.UNAUTHORIZED, headers: envelopeHeaders(traceId) }
        );
      }

      const params = await routeContext.params;

      return await handler(request, {
        userId,
        params,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: envelopeHeaders(traceId) }
      );
    }
  };
}
