/**
 * Orchestra Services API - List and Register
 * GET /api/orchestra/services - List all services
 * POST /api/orchestra/services - Register new service
 *
 * @domain orchestra
 * @layer api
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  listServices,
  registerService,
  KERNEL_ERROR_CODES,
  KERNEL_HEADERS,
  HTTP_STATUS,
  RegisterServiceInputSchema,
  getAuthContext,
} from "@afenda/orchestra";
import { fail, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/orchestra/services
 * List all registered services
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

  try {
    const result = await listServices({ db }, { traceId });
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
          message: "Failed to list services",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * POST /api/orchestra/services
 * Register a new service
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  const auth = await getAuthContext();
  if (!auth.userId) {
    return NextResponse.json(
      fail({ code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" }, { traceId }),
      { status: HTTP_STATUS.UNAUTHORIZED, headers }
    );
  }

  try {
    const body = await request.json();
    const validation = RegisterServiceInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid service registration data",
            details: validation.error.format(),
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await registerService({ db }, validation.data, { traceId });
    if (!result.ok) {
      const status = result.error.code === KERNEL_ERROR_CODES.CONFLICT ? HTTP_STATUS.CONFLICT : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(result, { status, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.CREATED, headers });
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
