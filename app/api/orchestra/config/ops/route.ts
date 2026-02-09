/**
 * Orchestra Kernel - Config API (OPS - Internal)
 * POST: Bulk config operations
 * DELETE: Delete config key
 *
 * @domain orchestra
 * @layer api/ops
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  bulkSetConfigs,
  deleteConfig,
  HTTP_STATUS,
  KERNEL_HEADERS,
  BulkSetConfigInputSchema,
  ConfigKeySchema,
  getAuthContext,
} from "@afenda/orchestra";
import { fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * POST /api/orchestra/config/ops
 * Bulk set multiple config values.
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const authContext = await getAuthContext();
  if (!authContext.userId) {
    return NextResponse.json(
      fail({ code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" }, { traceId }),
      { status: HTTP_STATUS.UNAUTHORIZED, headers }
    );
  }
  const actorId = authContext.userId;

  try {
    const body = await request.json();
    const parsed = BulkSetConfigInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid bulk config input",
            details: parsed.error.flatten(),
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await bulkSetConfigs({ db }, parsed.data, { traceId, actorId });
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to bulk set configs",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * DELETE /api/orchestra/config/ops?key=xxx
 * Delete a config key.
 */
export async function DELETE(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const authContext = await getAuthContext();
  if (!authContext.userId) {
    return NextResponse.json(
      fail({ code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" }, { traceId }),
      { status: HTTP_STATUS.UNAUTHORIZED, headers }
    );
  }
  const actorId = authContext.userId;
  const key = request.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      fail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message: "Config key is required" },
        { traceId }
      ),
      { status: HTTP_STATUS.BAD_REQUEST, headers }
    );
  }
  const parsed = ConfigKeySchema.safeParse(key);
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
  try {
    const result = await deleteConfig({ db }, key, { traceId, actorId });
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
          message: "Failed to delete config",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
