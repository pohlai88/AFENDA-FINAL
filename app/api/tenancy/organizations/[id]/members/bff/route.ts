/**
 * Tenancy BFF - Organization Members
 * GET: List organization members with roles
 * POST: Add member to organization
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
  withOrgAccess, 
  withRateLimitRoute, 
  memberInviteLimiter 
} from "@afenda/tenancy/server";
import { parseJson } from "@afenda/shared/server/validate";
import { z } from "zod";

const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export const GET = withOrgAccess(async (
  request: NextRequest,
  context
) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const { id: orgId } = context.params;
    const members = await tenancyMembershipService.listOrgMembers(orgId);

    return NextResponse.json(kernelOk({ members }, { traceId }), {
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
}, "member");

export const POST = withRateLimitRoute(
  withOrgAccess(async (
    request: NextRequest,
    authContext
  ) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      const { id: orgId } = authContext.params;
      const body = await request.json();
      const input = await parseJson(body, addMemberSchema);

      // Check if user already has a membership
      const existingMembers = await tenancyMembershipService.listOrgMembers(orgId);
      const existing = existingMembers.find(m => m.userId === input.userId);
      
      if (existing) {
        return NextResponse.json(
          kernelFail(
            { code: KERNEL_ERROR_CODES.VALIDATION, message: "User is already a member" },
            { traceId }
          ),
          { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
        );
      }

      const membership = await tenancyMembershipService.addOrgMember(
        orgId,
        input.userId,
        input.role,
        authContext.userId
      );

      // Audit log: member addition to organization
      await tenancyAuditService.log({
        actorId: authContext.userId,
        action: "membership.add",
        resourceType: "organization",
        resourceId: orgId,
        metadata: {
          newMemberId: input.userId,
          role: input.role,
        },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      });

      return NextResponse.json(kernelOk({ membership }, { traceId }), {
        status: HTTP_STATUS.CREATED,
        headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      
      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }
  }, "admin"),
  memberInviteLimiter
);
