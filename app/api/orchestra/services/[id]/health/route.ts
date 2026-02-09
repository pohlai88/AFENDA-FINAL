/**
 * Orchestra Services API - Manual Health Check
 * POST /api/orchestra/services/[id]/health - Trigger manual health check
 *
 * @domain orchestra
 * @layer api
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getService, KERNEL_ERROR_CODES, KERNEL_HEADERS, HTTP_STATUS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/orchestra/services/[id]/health
 * Trigger manual health check for a specific service
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  const auth = await getAuthContext();
  if (!auth.userId) {
    return NextResponse.json(
      fail({ code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" }, { traceId }),
      { status: HTTP_STATUS.UNAUTHORIZED, headers }
    );
  }

  const { id } = await params;

  try {
    const serviceResult = await getService({ db }, id, { traceId });

    if (!serviceResult.ok) {
      const status = serviceResult.error.code === KERNEL_ERROR_CODES.NOT_FOUND ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(serviceResult, { status, headers });
    }

    const service = serviceResult.data;
    const healthUrl = new URL(service.healthCheck, service.endpoint).toString();
    const startTime = Date.now();
    const timeoutMs = service.healthCheckTimeoutMs ?? 5000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const healthResponse = await fetch(healthUrl, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const isHealthy = healthResponse.ok;
      const status = isHealthy ? "healthy" : "unhealthy";

      return NextResponse.json(
        ok(
          {
            serviceId: id,
            status,
            latencyMs,
            httpStatus: healthResponse.status,
            timestamp: new Date().toISOString(),
          },
          { traceId }
        ),
        { status: HTTP_STATUS.OK, headers }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        ok(
          {
            serviceId: id,
            status: "unhealthy",
            latencyMs,
            error: errorMessage,
            timestamp: new Date().toISOString(),
          },
          { traceId }
        ),
        { status: HTTP_STATUS.OK, headers }
      );
    }
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to perform health check",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
