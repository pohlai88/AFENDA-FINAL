/**
 * Orchestra Kernel - Health API (v1 - Public)
 * GET: System health check
 *
 * @domain orchestra
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getHealthCheck, HTTP_STATUS, KERNEL_HEADERS } from "@afenda/orchestra";
import { fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/health/v1
 * Simple health check endpoint.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const result = await getHealthCheck({ db }, { traceId });
    return NextResponse.json(result, {
      status: HTTP_STATUS.OK,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Health check failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
