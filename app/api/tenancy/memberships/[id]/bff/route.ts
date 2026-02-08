/**
 * Tenancy BFF - Individual Membership Management
 * PATCH: Update own membership preferences
 * DELETE: Leave organization/team (self-removal)
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
  tenancyMembershipService, 
  tenancyAuditService, 
  withRateLimitRoute, 
  mutationLimiter 
} from "@afenda/tenancy/server";
import { parseJson } from "@afenda/shared/server/validate";
import { z } from "zod";
import { getAuthContext } from "@afenda/orchestra";

const updatePreferencesSchema = z.object({
  permissions: z.record(z.string(), z.boolean()).optional(),
});

export const PATCH = withRateLimitRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const { id: membershipId } = await params;
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

    // Get membership and verify ownership
    const membership = await tenancyMembershipService.getMembership(membershipId);
    
    if (!membership) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Membership not found" },
          { traceId }
        ),
        { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    if (membership.userId !== userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Can only update own membership" },
          { traceId }
        ),
        { status: HTTP_STATUS.FORBIDDEN, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    const body = await request.json();
    const input = await parseJson(body, updatePreferencesSchema);

    const updatedMembership = await tenancyMembershipService.updateMembership(
      membershipId,
      input
    );

    return NextResponse.json(kernelOk({ membership: updatedMembership }, { traceId }), {
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
}, mutationLimiter);

export const DELETE = withRateLimitRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const { id: membershipId } = await params;
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

    // Get membership and verify ownership
    const membership = await tenancyMembershipService.getMembership(membershipId);
    
    if (!membership) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Membership not found" },
          { traceId }
        ),
        { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    if (membership.userId !== userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Can only leave own membership" },
          { traceId }
        ),
        { status: HTTP_STATUS.FORBIDDEN, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    // Prevent last owner from leaving
    if (membership.role === "owner" && membership.organizationId) {
      const ownerCount = await tenancyMembershipService.countOrgOwners(membership.organizationId);
      if (ownerCount <= 1) {
        return NextResponse.json(
          kernelFail(
            { code: KERNEL_ERROR_CODES.VALIDATION, message: "Cannot leave as last owner. Transfer ownership first." },
            { traceId }
          ),
          { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
        );
      }
    }

    await tenancyMembershipService.deleteMembership(membershipId);

    // Audit log: self-removal from organization/team
    await tenancyAuditService.log({
      actorId: userId,
      action: "membership.leave",
      resourceType: "membership",
      resourceId: membershipId,
      metadata: {
        organizationId: membership.organizationId ?? undefined,
        teamId: membership.teamId ?? undefined,
        role: membership.role,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json(kernelOk({ success: true }, { traceId }), {
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
}, mutationLimiter);
