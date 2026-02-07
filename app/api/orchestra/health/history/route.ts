/**
 * Orchestra Kernel - Health History API
 * GET: Query health history for timeline visualization
 *
 * @domain orchestra
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getHealthHistory, HTTP_STATUS, KERNEL_HEADERS } from "@afenda/orchestra";
import { fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/health/history?serviceId=xxx&hours=24
 * Query health history for a service.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { searchParams } = request.nextUrl;

  const serviceId = searchParams.get("serviceId") ?? undefined;
  const hours = parseInt(searchParams.get("hours") || "24", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  try {
    const result = await getHealthHistory(
      { db },
      { serviceId, hours, limit },
      { traceId }
    );
    return NextResponse.json(result, {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to query health history",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
