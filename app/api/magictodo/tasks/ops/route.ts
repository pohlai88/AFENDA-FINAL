/**
 * Magictodo - Tasks API (OPS - Internal)
 * Internal operations: health, debug, bulk admin.
 *
 * @domain magictodo
 * @layer api/ops
 */

import "server-only";
import { NextRequest, NextResponse } from "next/server";

import {
  kernelFail,
  kernelOk,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { magictodoTaskService } from "@afenda/magictodo/server";

/**
 * GET /api/magictodo/tasks/ops
 * Internal health/debug info for the tasks module.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Authentication required",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    const init = await magictodoTaskService.initialize();
    const result = kernelOk(
      {
        module: "magictodo/tasks",
        tier: "ops",
        timestamp: new Date().toISOString(),
        actorId: userId,
        service: init.ok ? init.data : null,
      },
      { traceId }
    );

    return NextResponse.json(result, {
      status: HTTP_STATUS.OK,
      headers: { [KERNEL_HEADERS.TRACE_ID]: traceId },
    });
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Ops check failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { [KERNEL_HEADERS.TRACE_ID]: traceId },
      }
    );
  }
}
