/**
 * Orchestra Kernel - Backup API (BFF - UI Optimized)
 * GET: List backups with pagination; ?id=xxx for single backup
 *
 * @domain orchestra
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  listBackups,
  getBackup,
  KERNEL_HEADERS,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  getAuthContext,
} from "@afenda/orchestra";
import { ok, fail, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/orchestra/backup/bff
 * List backups or get single backup by ?id=xxx
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  const auth = await getAuthContext();
  if (!auth.userId) {
    return NextResponse.json(
      fail({ code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" }, { traceId }),
      { status: HTTP_STATUS.UNAUTHORIZED, headers }
    );
  }

  const searchParams = request.nextUrl.searchParams;

  try {
    const backupId = searchParams.get("id");
    if (backupId) {
      const result = await getBackup({ db }, backupId);
      if (!result.ok) {
        const status =
          result.error.code === KERNEL_ERROR_CODES.NOT_FOUND
            ? HTTP_STATUS.NOT_FOUND
            : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        return NextResponse.json(result, { status, headers });
      }
      return NextResponse.json(ok(result.data, { traceId }), {
        status: HTTP_STATUS.OK,
        headers,
      });
    }

    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const result = await listBackups({ db }, { limit, offset });

    if (!result.ok) {
      return NextResponse.json(result, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers,
      });
    }
    return NextResponse.json(ok(result.data, { traceId }), {
      status: HTTP_STATUS.OK,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to process backup request",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
