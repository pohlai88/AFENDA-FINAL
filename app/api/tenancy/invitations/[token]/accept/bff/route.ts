/**
 * Tenancy BFF - Accept Invitation
 * GET: View invitation details
 * POST: Accept invitation and create membership
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
  getAuthContext,
} from "@afenda/orchestra";
import { 
  tenancyInvitationService, 
  tenancyAuditService, 
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

/**
 * GET: View invitation details (public, no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const { token } = await params;
    const invitation = await tenancyInvitationService.getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Invitation not found" },
          { traceId }
        ),
        { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    // Check if expired
    const isExpired = invitation.expiresAt && new Date() > invitation.expiresAt;

    return NextResponse.json(kernelOk({ 
      invitation: {
        ...invitation,
        expiresAt: invitation.expiresAt?.toISOString() ?? "",
        createdAt: invitation.createdAt?.toISOString() ?? "",
        isExpired,
      }
    }, { traceId }), {
      status: HTTP_STATUS.OK,
      headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}

/**
 * POST: Accept invitation (requires authentication)
 */
export const POST = withRateLimitRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    // Check authentication
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;

    if (!userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    const { token } = await params;
    
    // Accept invitation (creates membership)
    const membership = await tenancyInvitationService.acceptInvitation(token, userId);

    // Audit log: invitation accepted
    await tenancyAuditService.log({
      actorId: userId,
      actorEmail: auth.userEmail ?? undefined,
      action: "invitation.accept",
      resourceType: "invitation",
      resourceId: token,
      organizationId: membership.organizationId ?? undefined,
      teamId: membership.teamId ?? undefined,
      metadata: {
        role: membership.role,
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(kernelOk({ 
      membership: {
        ...membership,
        joinedAt: membership.joinedAt?.toISOString() ?? "",
        createdAt: membership.createdAt?.toISOString() ?? "",
        updatedAt: membership.updatedAt?.toISOString() ?? "",
      }
    }, { traceId }), {
      status: HTTP_STATUS.CREATED,
      headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("not found") || message.includes("expired")
      ? HTTP_STATUS.BAD_REQUEST
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.VALIDATION, message }, { traceId }),
      { status, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}, mutationLimiter);

