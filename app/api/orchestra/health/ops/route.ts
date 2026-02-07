/**
 * Orchestra Kernel - Health API (OPS - Internal)
 * GET: Detailed diagnostics
 *
 * @domain orchestra
 * @layer api/ops
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDiagnostics, HTTP_STATUS, KERNEL_HEADERS } from "@afenda/orchestra";
import { fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/health/ops
 * Get detailed system diagnostics.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const result = await getDiagnostics({ db }, { traceId });
    return NextResponse.json(result, {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to get diagnostics",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
