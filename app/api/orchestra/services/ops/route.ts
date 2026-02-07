/**
 * Orchestra Kernel - Services API (OPS - Internal)
 * POST: Force refresh health status for all services
 * GET: Debug info for services
 *
 * @domain orchestra
 * @layer api/ops
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  listServices,
  checkAllServiceHealth,
  HTTP_STATUS,
  KERNEL_HEADERS,
} from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * POST /api/orchestra/services/ops
 * Force refresh health status for all services.
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const result = await checkAllServiceHealth({ db }, { traceId });
    return NextResponse.json(result, {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to refresh service health",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * GET /api/orchestra/services/ops
 * Get detailed debug information for all services.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const result = await listServices({ db }, { traceId });
    if (!result.ok) {
      return NextResponse.json(result, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers,
      });
    }
    return NextResponse.json(
      ok(
        {
          services: result.data.services,
          total: result.data.total,
          debug: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
          },
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
          message: "Failed to get service debug info",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
