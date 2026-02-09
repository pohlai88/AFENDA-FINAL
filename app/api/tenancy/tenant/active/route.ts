/**
 * Tenancy - Active Tenant API (BFF)
 * GET: Returns the currently active tenant from cookies
 *
 * @domain tenancy
 * @layer api/bff
 */

import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  kernelOk,
  kernelFail,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";

/**
 * GET /api/tenancy/tenant/active
 * Returns the currently active tenant from cookies.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = { [KERNEL_HEADERS.TRACE_ID]: traceId };

  try {
    const auth = await getAuthContext();
    if (!auth.userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    const cookieStore = await cookies();
    const orgId = cookieStore.get("activeTenantOrgId")?.value;
    const teamId = cookieStore.get("activeTenantTeamId")?.value;

    // Team takes precedence over org
    if (teamId) {
      return NextResponse.json(
        kernelOk({ type: "team" as const, id: teamId, organizationId: orgId ?? null }, { traceId }),
        { status: HTTP_STATUS.OK, headers }
      );
    }

    if (orgId) {
      return NextResponse.json(
        kernelOk({ type: "org" as const, id: orgId }, { traceId }),
        { status: HTTP_STATUS.OK, headers }
      );
    }

    // No active tenant
    return NextResponse.json(
      kernelOk({ type: null, id: null }, { traceId }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to get active tenant",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
