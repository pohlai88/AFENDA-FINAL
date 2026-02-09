/**
 * MagicDrive v1 - Object by ID (aligns with routes.api.magicdrive.v1.objects.byId(id))
 * GET: Fetch single document/object for detail view.
 *
 * @domain magicdrive
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_STATUS, KERNEL_HEADERS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { getDocumentAction } from "@afenda/magicdrive/server";
import { TENANT_HEADERS } from "@afenda/tenancy/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/magicdrive/v1/objects/[id]
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const traceId = _request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      fail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message: "Object id is required" },
        { traceId }
      ),
      { status: HTTP_STATUS.BAD_REQUEST, headers }
    );
  }

  try {
    const auth = await getAuthContext();
    const _userId = auth.userId ?? undefined;
    if (!_userId) {
      return NextResponse.json(
        fail(
          { code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    // Extract tenant context from middleware-injected headers
    const tenantId = _request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = _request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const doc = await getDocumentAction(id, { tenantId, teamId });
    if (!doc) {
      return NextResponse.json(
        fail(
          { code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Document not found" },
          { traceId }
        ),
        { status: HTTP_STATUS.NOT_FOUND, headers }
      );
    }

    return NextResponse.json(ok(doc, { traceId }), {
      status: HTTP_STATUS.OK,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to fetch document",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
