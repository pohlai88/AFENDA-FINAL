/**
 * Tenancy BFF - Cancel Organization Invitation
 * DELETE: Cancel a pending invitation
 *
 * @domain tenancy
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  kernelFail,
  kernelOk,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
} from "@afenda/orchestra";
import { 
  tenancyInvitationService, 
  tenancyAuditService, 
  withOrgAccess, 
  withRateLimitRoute, 
  mutationLimiter 
} from "@afenda/tenancy/server";

/**
 * Extract client IP from request headers
 */
function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}

export const DELETE = withRateLimitRoute(
  withOrgAccess(async (
    request: NextRequest,
    authContext
  ) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      const { organizationId = authContext.params.id, userId } = authContext;
      const { invitationId } = authContext.params;

      // Cancel invitation
      const invitation = await tenancyInvitationService.cancelInvitation(invitationId);

      // Audit log: invitation cancelled
      await tenancyAuditService.log({
        actorId: userId,
        action: "invitation.cancel",
        resourceType: "invitation",
        resourceId: invitationId,
        organizationId,
        metadata: {
          email: invitation.email,
          role: invitation.role,
        },
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || undefined,
      });

      return NextResponse.json(kernelOk({ success: true }, { traceId }), {
        status: HTTP_STATUS.OK,
        headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.includes("not found") 
        ? HTTP_STATUS.NOT_FOUND 
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.VALIDATION, message }, { traceId }),
        { status, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }
  }, "admin"),
  mutationLimiter
);

