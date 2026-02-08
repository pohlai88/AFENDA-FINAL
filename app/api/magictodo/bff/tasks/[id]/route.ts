/**
 * Magictodo BFF - Single task (aligns with routes.api.magictodo.bff.taskById(id))
 * GET: Fetch task by id. PATCH: Update. DELETE: Delete.
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
import { magictodoTaskService } from "@afenda/magictodo/server";
import { db } from "@afenda/shared/server/db";
import { TENANT_HEADERS } from "@afenda/tenancy/server";

type DbParam = Parameters<typeof magictodoTaskService.list>[5];

function toKernelCode(code: string): (typeof KERNEL_ERROR_CODES)[keyof typeof KERNEL_ERROR_CODES] {
  if (code === "NOT_FOUND") return KERNEL_ERROR_CODES.NOT_FOUND;
  if (code === "VALIDATION" || code === "CONFLICT") return KERNEL_ERROR_CODES.VALIDATION;
  return KERNEL_ERROR_CODES.INTERNAL;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/magictodo/bff/tasks/[id]
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const traceId = _request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      kernelFail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message: "Task id is required" },
        { traceId }
      ),
      { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }

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

    // Extract tenant context from middleware-injected headers
    const organizationId = _request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = _request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const result = await magictodoTaskService.getById(userId, id, organizationId, teamId, db as DbParam);
    if (!result.ok) {
      const err = (result as unknown as { error: { code: string; message: string } }).error;
      return NextResponse.json(
        kernelFail(
          { code: toKernelCode(err.code), message: err.message },
          { traceId }
        ),
        {
          status:
            err.code === "NOT_FOUND" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR,
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
          message: "Failed to fetch task",
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
 * PATCH /api/magictodo/bff/tasks/[id]
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      kernelFail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message: "Task id is required" },
        { traceId }
      ),
      { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }

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

    // Extract tenant context from middleware-injected headers
    const organizationId = request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const body = await request.json();
    const result = await magictodoTaskService.update(userId, id, organizationId, teamId, body, db as DbParam);
    if (!result.ok) {
      const err = (result as unknown as { error: { code: string; message: string } }).error;
      return NextResponse.json(
        kernelFail(
          { code: toKernelCode(err.code), message: err.message },
          { traceId }
        ),
        {
          status:
            err.code === "NOT_FOUND" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR,
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
 * DELETE /api/magictodo/bff/tasks/[id]
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const traceId = _request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      kernelFail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message: "Task id is required" },
        { traceId }
      ),
      { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }

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

    // Extract tenant context from middleware-injected headers
    const organizationId = _request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = _request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const result = await magictodoTaskService.delete(userId, id, organizationId, teamId, db as DbParam);
    if (!result.ok) {
      const err = (result as unknown as { error: { code: string; message: string } }).error;
      return NextResponse.json(
        kernelFail(
          { code: toKernelCode(err.code), message: err.message },
          { traceId }
        ),
        {
          status:
            err.code === "NOT_FOUND" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        data: (result as { data: unknown }).data ?? { deleted: true },
        traceId,
      },
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
