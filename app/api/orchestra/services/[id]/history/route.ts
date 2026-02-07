/**
 * Orchestra Services API - Health History
 * GET /api/orchestra/services/[id]/history - Get service health history
 *
 * @domain orchestra
 * @layer api
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getHealthHistory,
  calculateUptime,
  KERNEL_ERROR_CODES,
  KERNEL_HEADERS,
  HTTP_STATUS,
} from "@afenda/orchestra";
import { ok, fail, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/orchestra/services/[id]/history
 * Get health history for a specific service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "24", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const historyResult = await getHealthHistory(
      { db },
      { serviceId: id, hours, limit },
      { traceId }
    );

    if (!historyResult.ok) {
      const status = historyResult.error.code === KERNEL_ERROR_CODES.NOT_FOUND ? 404 : 500;
      return NextResponse.json(historyResult, { status, headers });
    }

    const uptimeResult = await calculateUptime({ db }, id, hours, { traceId });

    if (!uptimeResult.ok) {
      const status = uptimeResult.error.code === KERNEL_ERROR_CODES.NOT_FOUND ? 404 : 500;
      return NextResponse.json(uptimeResult, { status, headers });
    }

    return NextResponse.json(
      ok(
        {
          history: historyResult.data,
          uptime: uptimeResult.data,
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
          message: "Failed to fetch health history",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
