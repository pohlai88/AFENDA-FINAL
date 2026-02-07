/**
 * Magictodo BFF - Tasks list (aligns with routes.api.magictodo.bff.tasks())
 * GET: UI-optimized task list for app shell and task views
 *
 * @domain magictodo
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  kernelFail,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { magictodoTaskService, magictodoSnoozeService } from "@afenda/magictodo/server";
import { db } from "@afenda/shared/server/db";

type DbParam = Parameters<typeof magictodoTaskService.list>[5];
type SnoozeDbParam = Parameters<typeof magictodoSnoozeService.getSnoozedTasks>[4];

function toKernelCode(code: string): (typeof KERNEL_ERROR_CODES)[keyof typeof KERNEL_ERROR_CODES] {
  if (code === "NOT_FOUND") return KERNEL_ERROR_CODES.NOT_FOUND;
  if (code === "VALIDATION" || code === "CONFLICT") return KERNEL_ERROR_CODES.VALIDATION;
  return KERNEL_ERROR_CODES.INTERNAL;
}

/**
 * GET /api/magictodo/bff/tasks
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

    // Snoozed tasks come from a separate table; delegate to snooze service
    const isSnoozedOnly =
      statuses?.length === 1 && statuses[0] === "snoozed";

    let result: { ok: boolean; data?: { items: unknown[]; total: number }; error?: { code: string; message: string } };

    if (isSnoozedOnly) {
      const snoozeResult = await magictodoSnoozeService.getSnoozedTasks(
        userId,
        null,
        null,
        false, // exclude expired
        db as SnoozeDbParam
      );
      if (!snoozeResult.ok) {
        result = snoozeResult as { ok: false; error: { code: string; message: string } };
      } else {
        // Map snoozed records to task-like format for UI compatibility
        const rawItems = (snoozeResult.data?.items ?? []) as Array<{
          taskId: string;
          taskTitle: string;
          taskDescription?: string;
          taskPriority: string;
          taskDueDate?: Date;
          taskProjectId?: string;
          snoozedUntil: string;
          reason?: string;
          snoozeCount?: number;
        }>;
        const items = rawItems.slice(offset, offset + limit).map((st) => ({
          id: st.taskId,
          title: st.taskTitle,
          description: st.taskDescription ?? null,
          status: "snoozed" as const,
          priority: st.taskPriority,
          dueDate: st.taskDueDate?.toISOString() ?? null,
          projectId: st.taskProjectId ?? null,
          snoozedUntil: st.snoozedUntil,
          snoozeReason: st.reason ?? null,
          snoozeCount: st.snoozeCount ?? 0,
        }));
        result = {
          ok: true,
          data: {
            items,
            total: rawItems.length,
            limit,
            offset,
          },
        };
      }
    } else {
      result = await magictodoTaskService.list(
        userId,
        null,
        null,
        { status: statuses, projectId },
        { limit, offset },
        db as DbParam
      );
    }

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

/**
 * POST /api/magictodo/bff/tasks
 * Create a new task (BFF contract for frontend).
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    const body = await request.json();
    const result = await magictodoTaskService.create(userId, null, null, body, db as DbParam);

    if (!result.ok) {
      const err = (result as unknown as { error: { code: string; message: string } }).error;
      return NextResponse.json(
        kernelFail(
          { code: toKernelCode(err.code), message: err.message },
          { traceId }
        ),
        {
          status:
            err.code === "NOT_FOUND"
              ? HTTP_STATUS.NOT_FOUND
              : err.code === "VALIDATION"
                ? HTTP_STATUS.BAD_REQUEST
                : HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    return NextResponse.json(
      { ok: true, data: result.data, traceId },
      { status: HTTP_STATUS.CREATED, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to create task",
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
