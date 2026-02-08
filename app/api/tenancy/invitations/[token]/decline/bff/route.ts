/**
 * Tenancy BFF - Decline Invitation
 * POST: Decline an invitation
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
  mutationLimiter,
} from "@afenda/tenancy/server";

/**
 * POST: Decline invitation (requires authentication)
 */
export const POST = withRateLimitRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
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

    const invitation = await tenancyInvitationService.declineInvitation(token);

    // Audit log: invitation declined
    await tenancyAuditService.log({
      actorId: userId,
      actorEmail: auth.userEmail ?? undefined,
      action: "invitation.decline",
      resourceType: "invitation",
      resourceId: token,
      organizationId: invitation.organizationId ?? undefined,
      teamId: invitation.teamId ?? undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      kernelOk({ declined: true }, { traceId }),
      {
        status: HTTP_STATUS.OK,
        headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("not found") || message.includes("already processed")
      ? HTTP_STATUS.BAD_REQUEST
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.VALIDATION, message }, { traceId }),
      { status, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}, mutationLimiter);
