/**
 * Tenancy BFF - Tenant Design System
 * GET: Retrieve tenant's design system or defaults
 * PATCH: Update theme (primary color, radius, font)
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
  getTenantContext, 
  tenancyDesignSystemService, 
  tenancyAuditService, 
  withAuth, 
  withRateLimitRoute, 
  mutationLimiter 
} from "@afenda/tenancy/server";
import { tenancyUpdateDesignSystemRequestSchema } from "@afenda/tenancy/zod";
import { parseJson } from "@afenda/shared/server/validate";

export const GET = withAuth(async (request: NextRequest) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const { tenantId } = await getTenantContext();
    const designSystem = await tenancyDesignSystemService.getOrDefault(tenantId);

    return NextResponse.json(kernelOk({ designSystem }, { traceId }), {
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
});

export const PATCH = withRateLimitRoute(
  withAuth(async (request: NextRequest, authContext) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      const { tenantId } = await getTenantContext();
      
      // TODO: Add authorization check - only owners should be able to update design system
      // await assertUserHasOrgRole(authContext.userId, tenantId, "owner");

      const body = await request.json();
      const input = await parseJson(body, tenancyUpdateDesignSystemRequestSchema);

      const designSystem = await tenancyDesignSystemService.upsert(tenantId, input);

      // Audit log: design system update
      await tenancyAuditService.log({
        actorId: authContext.userId,
        action: "design_system.update",
        resourceType: "design_system",
        resourceId: tenantId,
        metadata: {
          changes: input,
        },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      });

      return NextResponse.json(kernelOk({ designSystem }, { traceId }), {
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
  }),
  mutationLimiter
);
