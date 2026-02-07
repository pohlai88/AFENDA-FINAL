/**
 * Magictodo - Tasks API (BFF - Frontend)
 * GET: UI-optimized task list for app shell and task views
 *
 * @domain magictodo
 * @layer api/bff
 */

import "server-only";
import { NextRequest, NextResponse } from "next/server";

import {
  kernelFail,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { magictodoTaskService } from "@afenda/magictodo/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/magictodo/tasks/bff
 * List tasks formatted for UI (filters, pagination, minimal payload).
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

    const status = request.nextUrl.searchParams.get("status");
    const statuses = status ? status.split(",").filter(Boolean) : undefined;
    const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 50), 100);
    const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);

    const result = await magictodoTaskService.list(
      userId,
      null,
      null,
      { status: statuses, projectId },
      { limit, offset },
      db as Parameters<typeof magictodoTaskService.list>[5]
    );

    if (!result.ok) {
      const statusCode =
        (result as { error?: { code?: string } }).error?.code === "NOT_FOUND"
          ? HTTP_STATUS.NOT_FOUND
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.INTERNAL,
            message: (result as { error?: { message?: string } }).error?.message ?? "List failed",
          },
          { traceId }
        ),
        { status: statusCode, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: result.data,
        traceId,
      },
      {
        status: HTTP_STATUS.OK,
        headers: { [KERNEL_HEADERS.TRACE_ID]: traceId },
      }
    );
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to list tasks",
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
