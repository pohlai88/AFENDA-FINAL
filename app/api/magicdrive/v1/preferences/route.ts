/**
 * MagicDrive v1 - User preferences (aligns with routes.api.v1.magicdrive.preferences())
 * GET: Fetch preferences. PUT: Update preferences.
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

const DEFAULT_PREFERENCES = {
  quickSettings: {
    defaultStatusFilter: "inbox" as const,
    defaultDocTypeFilter: "other" as const,
  },
  defaultView: "grid" as const,
};

export async function GET(_request: NextRequest) {
  const traceId = _request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  // Phase 4: Tenant context for user-scoped preferences
  const _organizationId = _request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
  const _teamId = _request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

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

    // TODO: Load from user prefs store; return defaults until then
    // Phase 4: Use _organizationId/_teamId to scope preferences per tenant
    const preferences = { ...DEFAULT_PREFERENCES };

    return NextResponse.json(
      ok({ preferences }, { traceId }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to fetch preferences",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

export async function PUT(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  // Phase 4: Tenant context for user-scoped preferences
  const _organizationId = request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
  const _teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

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

    const body = await request.json().catch(() => ({}));
    // TODO: Persist to user prefs store; for now echo back merged with defaults
    // Phase 4: Use organizationId/teamId to scope preferences per tenant
    const preferences = { ...DEFAULT_PREFERENCES, ...body };

    return NextResponse.json(
      ok({ preferences }, { traceId }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to update preferences",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
