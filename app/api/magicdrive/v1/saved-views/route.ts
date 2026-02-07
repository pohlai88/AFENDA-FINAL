/**
 * MagicDrive v1 - Saved views (aligns with routes.api.v1.magicdrive.savedViews())
 * GET: List saved views. POST: Create saved view.
 *
 * @domain magicdrive
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_STATUS, KERNEL_HEADERS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";

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

    // TODO: Load from saved-views store; return empty until then
    const items: unknown[] = [];

    return NextResponse.json(
      ok({ items }, { traceId }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to fetch saved views",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    // TODO: Persist to saved-views store; return stub until then
    const created = {
      id: `view-${crypto.randomUUID()}`,
      tenantId: "",
      userId,
      name: (body.name as string) ?? "Untitled view",
      description: (body.description as string) ?? "",
      filters: body.filters ?? {},
      viewMode: body.viewMode ?? "grid",
      sortBy: body.sortBy ?? "updatedAt",
      sortOrder: body.sortOrder ?? "desc",
      isPublic: Boolean(body.isPublic),
      isDefault: Boolean(body.isDefault),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      ok(created, { traceId }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to create saved view",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
