/**
 * MagicDrive v1 - Duplicate groups (aligns with routes.api.v1.magicdrive.duplicateGroups())
 * GET: List duplicate groups with optional limit/offset.
 *
 * @domain magicdrive
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_STATUS, KERNEL_HEADERS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { listDuplicateGroupsAction } from "@afenda/magicdrive/server";

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
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const offset = Number(searchParams.get("offset") ?? 0);

    const allGroups = await listDuplicateGroupsAction(userId);
    const total = allGroups.length;
    const items = allGroups.slice(offset, offset + limit).map((g) => ({
      ...g,
      tenantId: userId,
    }));

    return NextResponse.json(
      ok({ items, total }, { traceId }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to list duplicate groups",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
