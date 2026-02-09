/**
 * Orchestra Kernel - Config API (v1 - Public)
 * GET: Get config by key
 * PUT: Set config
 *
 * @domain orchestra
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getConfig,
  setConfig,
  listConfigs,
  HTTP_STATUS,
  KERNEL_HEADERS,
  SetConfigInputSchema,
  GetConfigInputSchema,
  getAuthContext,
} from "@afenda/orchestra";
import { fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/config/v1?key=xxx
 * Get a config value by key, or list all if no key provided.
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

  const key = request.nextUrl.searchParams.get("key");
  const prefix = request.nextUrl.searchParams.get("prefix") ?? undefined;

  try {
    if (key) {
      const parsed = GetConfigInputSchema.safeParse({ key });
      if (!parsed.success) {
        return NextResponse.json(
          fail(
            {
              code: KERNEL_ERROR_CODES.VALIDATION,
              message: "Invalid config key",
              details: parsed.error.flatten(),
            },
            { traceId }
          ),
          { status: HTTP_STATUS.BAD_REQUEST, headers }
        );
      }
      const result = await getConfig({ db }, key, { traceId });
      const status = result.ok
        ? HTTP_STATUS.OK
        : result.error.code === KERNEL_ERROR_CODES.NOT_FOUND
          ? HTTP_STATUS.NOT_FOUND
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(result, { status, headers });
    }
    const result = await listConfigs({ db }, { prefix, traceId });
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to get config",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * PUT /api/orchestra/config/v1
 * Set a config value (upsert).
 */
export async function PUT(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  const auth = await getAuthContext();
  if (!auth.userId) {
    return NextResponse.json(
      fail({ code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" }, { traceId }),
      { status: HTTP_STATUS.UNAUTHORIZED, headers }
    );
  }

  const actorId = auth.userId;

  try {
    const body = await request.json();
    const parsed = SetConfigInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid config input",
            details: parsed.error.flatten(),
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await setConfig({ db }, parsed.data, { traceId, actorId });
    return NextResponse.json(result, {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to set config",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
