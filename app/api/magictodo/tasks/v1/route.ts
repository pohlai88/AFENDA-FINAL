/**
 * Magictodo - Tasks API (v1 - Public stable)
 * GET: List tasks or get by id
 * POST: Create task
 * PUT: Update task
 * DELETE: Delete task
 *
 * @domain magictodo
 * @layer api/v1
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

type DbParam = Parameters<typeof magictodoTaskService.list>[5];

function toKernelCode(code: string): (typeof KERNEL_ERROR_CODES)[keyof typeof KERNEL_ERROR_CODES] {
  if (code === "NOT_FOUND") return KERNEL_ERROR_CODES.NOT_FOUND;
  if (code === "VALIDATION" || code === "CONFLICT") return KERNEL_ERROR_CODES.VALIDATION;
  return KERNEL_ERROR_CODES.INTERNAL;
}

/**
 * GET /api/magictodo/tasks/v1
 * List tasks (stable contract) or get single task by ?id=xxx
 */
export async function GET(request: NextRequest) {
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

    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const result = await magictodoTaskService.getById(userId, id, null, null, db as DbParam);
      if (!result.ok) {
        const err = (result as unknown as { error: { code: string; message: string } }).error;
        return NextResponse.json(
          kernelFail(
            { code: toKernelCode(err.code), message: err.message },
            { traceId }
          ),
          {
            status: err.code === "NOT_FOUND" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: { [KERNEL_HEADERS.TRACE_ID]: traceId },
          }
        );
      }
      return NextResponse.json(
        { ok: true, data: result.data, traceId },
        { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
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
      db as DbParam
    );

    if (!result.ok) {
      const err = (result as unknown as { error: { message?: string } }).error;
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.INTERNAL, message: err?.message ?? "List failed" },
          { traceId }
        ),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    return NextResponse.json(
      { ok: true, data: result.data, traceId },
      { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to get tasks",
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
 * POST /api/magictodo/tasks/v1
 * Create a new task (stable contract).
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

/**
 * PUT /api/magictodo/tasks/v1?id=xxx
 * Update an existing task.
 */
export async function PUT(request: NextRequest) {
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

    const taskId = request.nextUrl.searchParams.get("id");
    if (!taskId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Query parameter id is required" },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    const body = await request.json();
    const result = await magictodoTaskService.update(userId, taskId, null, null, body, db as DbParam);

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
              : HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    return NextResponse.json(
      { ok: true, data: result.data, traceId },
      { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to update task",
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
 * DELETE /api/magictodo/tasks/v1?id=xxx
 * Delete a task.
 */
export async function DELETE(request: NextRequest) {
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

    const taskId = request.nextUrl.searchParams.get("id");
    if (!taskId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Query parameter id is required" },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    const result = await magictodoTaskService.delete(userId, taskId, null, null, db as DbParam);

    if (!result.ok) {
      const err = (result as unknown as { error: { code: string; message: string } }).error;
      return NextResponse.json(
        kernelFail(
          { code: toKernelCode(err.code), message: err.message },
          { traceId }
        ),
        {
          status: err.code === "NOT_FOUND" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    return NextResponse.json(
      { ok: true, data: (result as { data: unknown }).data ?? { deleted: true }, traceId },
      { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to delete task",
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
