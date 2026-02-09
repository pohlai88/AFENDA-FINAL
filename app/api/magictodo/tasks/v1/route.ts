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
  kernelOk,
  kernelFail,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { envelopeHeaders } from "@afenda/shared/server";
import { magictodoTaskService } from "@afenda/magictodo/server";
import { db } from "@afenda/shared/server/db";
import { TENANT_HEADERS } from "@afenda/tenancy/server";

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
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    // Extract tenant context from middleware-injected headers
    const organizationId = request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const result = await magictodoTaskService.getById(userId, id, organizationId, teamId, db as DbParam);
      if (!result.ok) {
        const err = (result as unknown as { error: { code: string; message: string } }).error;
        return NextResponse.json(
          kernelFail(
            { code: toKernelCode(err.code), message: err.message },
            { traceId }
          ),
          {
            status: err.code === "NOT_FOUND" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers,
          }
        );
      }
      return NextResponse.json(
        kernelOk(result.data, { traceId }),
        { status: HTTP_STATUS.OK, headers }
      );
    }

    const status = request.nextUrl.searchParams.get("status");
    const statuses = status ? status.split(",").filter(Boolean) : undefined;
    const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 50), 100);
    const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);

    const result = await magictodoTaskService.list(
      userId,
      organizationId,
      teamId,
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
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
      );
    }

    return NextResponse.json(
      kernelOk(result.data, { traceId }),
      { status: HTTP_STATUS.OK, headers }
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
        headers,
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
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    // Extract tenant context from middleware-injected headers
    const organizationId = request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const body = await request.json();
    const result = await magictodoTaskService.create(userId, organizationId, teamId, body, db as DbParam);

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
          headers,
        }
      );
    }

    return NextResponse.json(
      kernelOk(result.data, { traceId }),
      { status: HTTP_STATUS.CREATED, headers }
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
        headers,
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
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    const taskId = request.nextUrl.searchParams.get("id");
    if (!taskId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Query parameter id is required" },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }

    // Extract tenant context from middleware-injected headers
    const organizationId = request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const body = await request.json();
    const result = await magictodoTaskService.update(userId, taskId, organizationId, teamId, body, db as DbParam);

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
          headers,
        }
      );
    }

    return NextResponse.json(
      kernelOk(result.data, { traceId }),
      { status: HTTP_STATUS.OK, headers }
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
        headers,
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
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    const taskId = request.nextUrl.searchParams.get("id");
    if (!taskId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Query parameter id is required" },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }

    // Extract tenant context from middleware-injected headers
    const organizationId = request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const result = await magictodoTaskService.delete(userId, taskId, organizationId, teamId, db as DbParam);

    if (!result.ok) {
      const err = (result as unknown as { error: { code: string; message: string } }).error;
      return NextResponse.json(
        kernelFail(
          { code: toKernelCode(err.code), message: err.message },
          { traceId }
        ),
        {
          status: err.code === "NOT_FOUND" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers,
        }
      );
    }

    return NextResponse.json(
      kernelOk((result as { data: unknown }).data ?? { deleted: true }, { traceId }),
      { status: HTTP_STATUS.OK, headers }
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
        headers,
      }
    );
  }
}
