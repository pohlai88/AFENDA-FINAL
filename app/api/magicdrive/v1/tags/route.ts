/**
 * MagicDrive v1 - Tags (aligns with routes.api.v1.magicdrive.tags())
 * GET: List tags for filtering.
 *
 * @domain magicdrive
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_STATUS, KERNEL_HEADERS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { TENANT_HEADERS } from "@afenda/tenancy/server";

export async function GET(_request: NextRequest) {
  const traceId = _request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    if (!auth.userId) {
      return NextResponse.json(
        fail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    // Extract tenant context from middleware-injected headers
    const _organizationId = _request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const _teamId = _request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    // TODO: Implement with actual tags store; filter by tenant context
    const items: Array<{ id: string; name: string; slug: string }> = [];

    return NextResponse.json(
      ok({ items }, { traceId }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to fetch tags",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
