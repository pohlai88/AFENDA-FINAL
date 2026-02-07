/**
 * MagicDrive v1 - List documents (aligns with routes.api.v1.magicdrive.list())
 * GET: List with query params: limit, offset, sortBy, sortOrder, status, docType, q, tagId, hasTags, hasType.
 *
 * @domain magicdrive
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_STATUS, KERNEL_HEADERS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { listDocumentsAction } from "@afenda/magicdrive/server";

const LIST_LIMIT_MAX = 100;
const LIST_LIMIT_DEFAULT = 50;

export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        fail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      Number(searchParams.get("limit") ?? LIST_LIMIT_DEFAULT),
      LIST_LIMIT_MAX
    );
    const offset = Number(searchParams.get("offset") ?? 0);
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";
    const status = searchParams.get("status") ?? undefined;
    const docType = searchParams.get("docType") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const tagId = searchParams.get("tagId") ?? undefined;

    const result = await listDocumentsAction({
      workspaceId: userId,
      status,
      type: docType,
      search: q,
      tagIds: tagId ? [tagId] : undefined,
      sortBy,
      sortOrder,
      limit,
      offset,
    });

    return NextResponse.json(
      ok(
        { items: result.documents, total: result.total },
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
