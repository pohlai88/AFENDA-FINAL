/**
 * Tenancy BFF - Individual Organization Member
 * PATCH: Update member role
 * DELETE: Remove member from organization
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
  tenancyMembershipService, 
  assertUserHasOrgRole,
  withRateLimitRoute,
  mutationLimiter,
  tenancyAuditService,
} from "@afenda/tenancy/server";
import { parseJson } from "@afenda/shared/server/validate";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});

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

export const PATCH = withRateLimitRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const { id: orgId, userId: targetUserId } = await params;
    const auth = await getAuthContext();
    const currentUserId = auth.userId ?? undefined;
    
    if (!currentUserId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    // Only owners can change roles
    await assertUserHasOrgRole(currentUserId, orgId, "owner");

    const body = await request.json();
    const input = await parseJson(body, updateRoleSchema);

    // Find the membership to update
    const members = await tenancyMembershipService.listOrgMembers(orgId);
    const targetMembership = members.find(m => m.userId === targetUserId);
    
    if (!targetMembership) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Member not found" },
          { traceId }
        ),
        { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    // Prevent removing last owner
    if (targetMembership.role === "owner" && input.role !== "owner") {
      const ownerCount = await tenancyMembershipService.countOrgOwners(orgId);
      if (ownerCount <= 1) {
        return NextResponse.json(
          kernelFail(
            { code: KERNEL_ERROR_CODES.VALIDATION, message: "Cannot remove last owner" },
            { traceId }
          ),
          { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
        );
      }
    }

    const oldRole = targetMembership.role;
    const updatedMembership = await tenancyMembershipService.updateMembership(
      targetMembership.id,
      { role: input.role }
    );

    // Audit log: membership role changed
    await tenancyAuditService.log({
      action: "membership.role_change",
      actorId: currentUserId,
      actorEmail: auth.userEmail ?? undefined,
      organizationId: orgId,
      resourceType: "membership",
      resourceId: targetMembership.id,
      metadata: {
        targetUserId,
        oldRole,
        newRole: input.role,
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(kernelOk({ membership: updatedMembership }, { traceId }), {
      status: HTTP_STATUS.OK,
      headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("Forbidden") 
      ? HTTP_STATUS.FORBIDDEN 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      { status, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}, mutationLimiter);

export const DELETE = withRateLimitRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const { id: orgId, userId: targetUserId } = await params;
    const auth = await getAuthContext();
    const currentUserId = auth.userId ?? undefined;
    
    if (!currentUserId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    // Only owners and admins can remove members
    await assertUserHasOrgRole(currentUserId, orgId, "admin");

    // Find the membership to delete
    const members = await tenancyMembershipService.listOrgMembers(orgId);
    const targetMembership = members.find(m => m.userId === targetUserId);
    
    if (!targetMembership) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Member not found" },
          { traceId }
        ),
        { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    // Prevent removing last owner
    if (targetMembership.role === "owner") {
      const ownerCount = await tenancyMembershipService.countOrgOwners(orgId);
      if (ownerCount <= 1) {
        return NextResponse.json(
          kernelFail(
            { code: KERNEL_ERROR_CODES.VALIDATION, message: "Cannot remove last owner" },
            { traceId }
          ),
          { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
        );
      }
    }

    await tenancyMembershipService.deleteMembership(targetMembership.id);

    // Audit log: member removed
    await tenancyAuditService.log({
      action: "membership.remove",
      actorId: currentUserId,
      actorEmail: auth.userEmail ?? undefined,
      organizationId: orgId,
      resourceType: "membership",
      resourceId: targetMembership.id,
      metadata: {
        removedUserId: targetUserId,
        removedUserRole: targetMembership.role,
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
    const status = message.includes("Forbidden") 
      ? HTTP_STATUS.FORBIDDEN 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      { status, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}, mutationLimiter);
