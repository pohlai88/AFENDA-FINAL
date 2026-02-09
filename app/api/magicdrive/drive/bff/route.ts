/**
 * Magicdrive - Drive API (BFF - Frontend)
 * GET: UI-optimized document/list for app shell and drive views
 *
 * @domain magicdrive
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_STATUS, KERNEL_HEADERS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { LIST_LIMIT } from "@afenda/magicdrive/constant";
import { listDocumentsAction } from "@afenda/magicdrive/server";
import { TENANT_HEADERS } from "@afenda/tenancy/server";

/**
 * GET /api/magicdrive/drive/bff
 * List documents formatted for UI (saved views, filters, minimal payload).
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        fail(
          { code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    // Extract tenant context from middleware-injected headers
    const tenantId = request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? userId;
    const folderId = request.nextUrl.searchParams.get("folderId") ?? undefined;
    const limit = Math.min(
      Number(request.nextUrl.searchParams.get("limit") ?? LIST_LIMIT.DEFAULT),
      LIST_LIMIT.MAX
    );
    const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);

    const result = await listDocumentsAction({
      workspaceId,
      folderId: folderId ?? null,
      tenantId,
      teamId,
      limit,
      offset,
    });

    return NextResponse.json(
      ok(
        {
          documents: result.documents,
          total: result.total,
          limit,
          offset,
        },
        { traceId }
      ),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to list documents",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

