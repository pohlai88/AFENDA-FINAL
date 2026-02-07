/**
 * Orchestra Services API - Individual Service Operations
 * GET /api/orchestra/services/[id] - Get service details
 * PATCH /api/orchestra/services/[id] - Update service metadata
 * DELETE /api/orchestra/services/[id] - Unregister service
 *
 * @domain orchestra
 * @layer api
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getService,
  updateServiceMetadata,
  unregisterService,
  KERNEL_ERROR_CODES,
  KERNEL_HEADERS,
  HTTP_STATUS,
  UpdateServiceMetadataSchema,
} from "@afenda/orchestra";
import { fail, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/orchestra/services/[id]
 * Get service details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await context.params;

  try {
    const result = await getService({ db }, id, { traceId });
    if (!result.ok) {
      const status = result.error.code === KERNEL_ERROR_CODES.NOT_FOUND ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(result, { status, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
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
 * PATCH /api/orchestra/services/[id]
 * Update service metadata
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await context.params;

  try {
    const body = await request.json();
    const validation = UpdateServiceMetadataSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid service metadata",
            details: validation.error.format(),
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await updateServiceMetadata(
      { db },
      id,
      validation.data,
      { traceId }
    );
    if (!result.ok) {
      const status = result.error.code === KERNEL_ERROR_CODES.NOT_FOUND ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(result, { status, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to update service metadata",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * DELETE /api/orchestra/services/[id]
 * Unregister service
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await context.params;

  try {
    const result = await unregisterService({ db }, id, { traceId });
    if (!result.ok) {
      const status = result.error.code === KERNEL_ERROR_CODES.NOT_FOUND ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(result, { status, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
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
