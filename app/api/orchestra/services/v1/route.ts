/**
 * Orchestra Kernel - Services API (v1 - Public)
 * POST: Register a new service
 * GET: List all services
 *
 * @domain orchestra
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  registerService,
  listServices,
  HTTP_STATUS,
  KERNEL_HEADERS,
  RegisterServiceInputSchema,
} from "@afenda/orchestra";
import { fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * POST /api/orchestra/services/v1
 * Register a new service with the kernel.
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const actorId = request.headers.get(KERNEL_HEADERS.ACTOR_ID) ?? undefined;

  try {
    const body = await request.json();
    const parsed = RegisterServiceInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid service registration input",
            details: parsed.error.flatten(),
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await registerService({ db }, parsed.data, { traceId, actorId });
    return NextResponse.json(result, {
      status: result.ok ? HTTP_STATUS.CREATED : HTTP_STATUS.CONFLICT,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to register service",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * GET /api/orchestra/services/v1
 * List all registered services.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const result = await listServices({ db }, { traceId });
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to list services",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
