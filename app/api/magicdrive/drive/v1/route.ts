/**
 * Magicdrive - Drive API (v1 - Public stable)
 * GET: List documents (public contract); ?id=... for single document.
 *
 * @domain magicdrive
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_STATUS, KERNEL_HEADERS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { LIST_LIMIT } from "@afenda/magicdrive/constant";
import { listDocumentsAction, getDocumentAction } from "@afenda/magicdrive/server";
import { TENANT_HEADERS } from "@afenda/tenancy/server";

/**
 * GET /api/magicdrive/drive/v1
 * List documents (stable contract). Query: workspaceId, folderId, limit, offset.
 * GET /api/magicdrive/drive/v1?id=<id> for single document.
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

    const id = request.nextUrl.searchParams.get("id");
    if (id) {
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
    }

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
        { items: result.documents, total: result.total, limit, offset },
        { traceId }
      ),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to get documents",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

