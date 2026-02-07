/**
 * Orchestra Kernel - Single Service API (v1 - Public)
 * GET: Get a single service by ID
 * DELETE: Unregister a service
 *
 * @domain orchestra
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getService,
  unregisterService,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
} from "@afenda/orchestra";
import { fail, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/orchestra/services/[id]/v1
 * Get a single service by ID.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await context.params;

  try {
    const result = await getService({ db }, id, { traceId });
    const status = result.ok
      ? HTTP_STATUS.OK
      : result.error.code === KERNEL_ERROR_CODES.NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json(result, { status, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to get service",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * DELETE /api/orchestra/services/[id]/v1
 * Unregister a service.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await context.params;
  const actorId = request.headers.get(KERNEL_HEADERS.ACTOR_ID) ?? undefined;

  try {
    const result = await unregisterService({ db }, id, { traceId, actorId });
    const status = result.ok
      ? HTTP_STATUS.OK
      : result.error.code === KERNEL_ERROR_CODES.NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json(result, { status, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to unregister service",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
