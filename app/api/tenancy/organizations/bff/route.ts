/**
 * Tenancy BFF - Organizations list/create (aligns with routes.api.tenancy.organizations.bff.list())
 * GET: List organizations for user
 * POST: Create organization
 *
 * @domain tenancy
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";

import {
  kernelFail,
  kernelOk,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { isTenancyTableMissingError } from "@afenda/tenancy";
import { 
  tenancyOrganizationService,
  withRateLimit,
  orgCreationLimiter,
  tenancyAuditService,
} from "@afenda/tenancy/server";
import {
  tenancyCreateOrganizationSchema,
  tenancyOrganizationQuerySchema,
} from "@afenda/tenancy/zod";
import { parseJson, parseSearchParams } from "@afenda/shared/server/validate";

const TENANCY_ORGS_CACHE_TTL = 60;
const TENANCY_ORGS_TAG = "tenancy-orgs";

const DEFAULT_LIST_QUERY = { page: 1, limit: 100 };

const getCachedOrgList = unstable_cache(
  async (userId: string, queryJson: string) => {
    const query = queryJson
      ? tenancyOrganizationQuerySchema.parse(Object.fromEntries(new URLSearchParams(queryJson)))
      : DEFAULT_LIST_QUERY;
    return tenancyOrganizationService.listForUser(userId, { ...DEFAULT_LIST_QUERY, ...query });
  },
  ["tenancy-orgs-list"],
  { revalidate: TENANCY_ORGS_CACHE_TTL, tags: [TENANCY_ORGS_TAG] }
);

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

export async function GET(request: NextRequest) {
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

    const _query = parseSearchParams(
      request.nextUrl.searchParams,
      tenancyOrganizationQuerySchema
    );
    const queryJson = request.nextUrl.searchParams.toString();
    const result = await getCachedOrgList(userId, queryJson);
    return NextResponse.json(kernelOk(result, { traceId }), {
      status: HTTP_STATUS.OK,
      headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
    });
  } catch (err) {
    const message = isTenancyTableMissingError(err)
      ? "Tenancy tables not found. Run: pnpm db:migrate"
      : (err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}

export const POST = withRateLimit(async (request: NextRequest) => {
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

    const body = await parseJson(request, tenancyCreateOrganizationSchema);
    const org = await tenancyOrganizationService.create(body, userId);
    revalidateTag(TENANCY_ORGS_TAG, { expire: TENANCY_ORGS_CACHE_TTL });

    // Audit log: organization created
    await tenancyAuditService.log({
      action: "organization.create",
      actorId: userId,
      actorEmail: auth.userEmail ?? undefined,
      organizationId: org.id,
      resourceType: "organization",
      resourceId: org.id,
      metadata: {
        name: org.name,
        slug: org.slug,
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
      { status: HTTP_STATUS.CREATED, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create organization";
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.VALIDATION, message }, { traceId }),
      { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}, orgCreationLimiter);
