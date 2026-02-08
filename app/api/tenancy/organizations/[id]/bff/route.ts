/**
 * Tenancy BFF - Organization by id (aligns with routes.api.tenancy.organizations.bff.byId(id))
 * GET: Get organization
 * PATCH: Update organization
 * DELETE: Delete organization
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
  tenancyOrganizationService,
  withOrgAccess,
  withRateLimitRoute,
  mutationLimiter,
  tenancyAuditService,
} from "@afenda/tenancy/server";
import { tenancyUpdateOrganizationSchema } from "@afenda/tenancy/zod";
import { parseJson } from "@afenda/shared/server/validate";

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

export const GET = withOrgAccess(
  async (request, { organizationId }) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      const org = await tenancyOrganizationService.getById(organizationId!);
      if (!org) {
        return NextResponse.json(
          kernelFail({ code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Organization not found" }, { traceId }),
          { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
        );
      }

      return NextResponse.json(
        kernelOk(
          {
            ...org,
            createdAt: org.createdAt?.toISOString() ?? "",
            updatedAt: org.updatedAt?.toISOString() ?? "",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get organization";
      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }
  },
  "member" // Any org member can view
);

export const PATCH = withRateLimitRoute(
  async (request, { params }: { params: Promise<{ id: string }> }) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
    const { id } = await params;

    return withOrgAccess(
      async (req, { userId, organizationId }) => {
        try {
          const body = await parseJson(request, tenancyUpdateOrganizationSchema);
          const oldOrg = await tenancyOrganizationService.getById(organizationId!);
          
          const org = await tenancyOrganizationService.update(organizationId!, body);
          if (!org) {
            return NextResponse.json(
              kernelFail({ code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Organization not found" }, { traceId }),
              { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
            );
          }

          // Audit log: organization updated
          const auth = await getAuthContext();
          await tenancyAuditService.log({
            action: "organization.update",
            actorId: userId,
            actorEmail: auth.userEmail ?? undefined,
            organizationId: org.id,
            resourceType: "organization",
            resourceId: org.id,
            metadata: {
              changes: body,
              oldName: oldOrg?.name,
              newName: org.name,
            },
            ipAddress: getClientIp(request),
            userAgent: request.headers.get("user-agent") || undefined,
          });

          return NextResponse.json(
            kernelOk(
              {
                ...org,
                createdAt: org.createdAt?.toISOString() ?? "",
                updatedAt: org.updatedAt?.toISOString() ?? "",
              },
              { traceId }
            ),
            { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to update organization";
          return NextResponse.json(
            kernelFail({ code: KERNEL_ERROR_CODES.VALIDATION, message }, { traceId }),
            { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
          );
        }
      },
      "admin" // Only admins can update
    )(request, { params: Promise.resolve({ id }) });
  },
  mutationLimiter
);

export const DELETE = withRateLimitRoute(
  async (request, { params }: { params: Promise<{ id: string }> }) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
    const { id } = await params;

    return withOrgAccess(
      async (req, { userId, organizationId }) => {
        try {
          const orgToDelete = await tenancyOrganizationService.getById(organizationId!);
          
          const deleted = await tenancyOrganizationService.delete(organizationId!);
          if (!deleted) {
            return NextResponse.json(
              kernelFail({ code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Organization not found" }, { traceId }),
              { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
            );
          }

          // Audit log: organization deleted
          const auth = await getAuthContext();
          await tenancyAuditService.log({
            action: "organization.delete",
            actorId: userId,
            actorEmail: auth.userEmail ?? undefined,
            organizationId: organizationId!,
            resourceType: "organization",
            resourceId: organizationId!,
            metadata: {
              name: orgToDelete?.name,
              slug: orgToDelete?.slug,
            },
            ipAddress: getClientIp(request),
            userAgent: request.headers.get("user-agent") || undefined,
          });

          return NextResponse.json(
            kernelOk({ deleted: true }, { traceId }),
            { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to delete organization";
          return NextResponse.json(
            kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
          );
        }
      },
      "owner" // Only owners can delete
    )(request, { params: Promise.resolve({ id }) });
  },
  mutationLimiter
);
