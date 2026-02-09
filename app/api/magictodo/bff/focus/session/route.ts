/**
 * Magictodo BFF - Focus session (aligns with routes.api.magictodo.bff.focus.session())
 * GET:   Current active focus session for the authenticated user
 * POST:  Start a new focus session with a list of task IDs
 * PATCH: Toggle (pause/resume) or end a focus session
 *
 * @domain magictodo
 * @layer api/bff
 * @consumer Frontend only
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  kernelOk,
  kernelFail,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { envelopeHeaders } from "@afenda/shared/server";
import { magictodoFocusService } from "@afenda/magictodo/server";
import { db } from "@afenda/shared/server/db";
import { TENANT_HEADERS } from "@afenda/tenancy/server";

type DbParam = Parameters<typeof magictodoFocusService.getCurrentSession>[3];

/**
 * GET /api/magictodo/bff/focus/session
 * Get current active focus session.
 */
export async function GET(request: NextRequest) {
  const traceId =
    request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.UNAUTHORIZED,
            message: "Authentication required",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    const organizationId =
      request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const result = await magictodoFocusService.getCurrentSession(
      userId,
      organizationId,
      teamId,
      db as DbParam
    );

    if (!result.ok) {
      const err = (
        result as unknown as { error: { code: string; message: string } }
      ).error;
      return NextResponse.json(
        kernelFail(
          {
            code:
              err?.code === "NOT_FOUND"
                ? KERNEL_ERROR_CODES.NOT_FOUND
                : KERNEL_ERROR_CODES.INTERNAL,
            message: err?.message ?? "Failed to get focus session",
          },
          { traceId }
        ),
        {
          status:
            err?.code === "NOT_FOUND"
              ? HTTP_STATUS.NOT_FOUND
              : HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers,
        }
      );
    }

    return NextResponse.json(kernelOk(result.data, { traceId }), {
      status: HTTP_STATUS.OK,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to get focus session",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * POST /api/magictodo/bff/focus/session
 * Start a new focus session.
 * Body: { taskIds: string[], dailyGoal?: number, settings?: Record<string, unknown> }
 */
export async function POST(request: NextRequest) {
  const traceId =
    request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.UNAUTHORIZED,
            message: "Authentication required",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    const organizationId =
      request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const body = await request.json();

    if (
      !body.taskIds ||
      !Array.isArray(body.taskIds) ||
      body.taskIds.length === 0
    ) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "taskIds array is required and must not be empty",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }

    const result = await magictodoFocusService.startSession(
      userId,
      organizationId,
      teamId,
      {
        taskIds: body.taskIds,
        dailyGoal: body.dailyGoal,
        settings: body.settings,
      },
      db as DbParam
    );

    if (!result.ok) {
      const err = (
        result as unknown as { error: { code: string; message: string } }
      ).error;
      const status =
        err.code === "SESSION_EXISTS"
          ? HTTP_STATUS.CONFLICT
          : err.code === "TASKS_NOT_FOUND"
            ? HTTP_STATUS.NOT_FOUND
            : HTTP_STATUS.BAD_REQUEST;
      return NextResponse.json(
        kernelFail(
          {
            code:
              err.code === "SESSION_EXISTS"
                ? KERNEL_ERROR_CODES.CONFLICT
                : err.code === "TASKS_NOT_FOUND"
                  ? KERNEL_ERROR_CODES.NOT_FOUND
                  : KERNEL_ERROR_CODES.VALIDATION,
            message: err.message,
          },
          { traceId }
        ),
        { status, headers }
      );
    }

    return NextResponse.json(kernelOk(result.data, { traceId }), {
      status: HTTP_STATUS.CREATED,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to start focus session",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * PATCH /api/magictodo/bff/focus/session
 * Toggle (pause/resume) or end a focus session.
 * Body: { action: 'pause' | 'resume' | 'end', sessionId: string, status?: 'completed' | 'aborted' }
 */
export async function PATCH(request: NextRequest) {
  const traceId =
    request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const userId = auth.userId ?? undefined;
    if (!userId) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.UNAUTHORIZED,
            message: "Authentication required",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    const organizationId =
      request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const body = await request.json();
    const action: string | undefined = body.action;
    const sessionId: string | undefined = body.sessionId;

    if (!action || !sessionId) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "action and sessionId are required",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }

    if (!["pause", "resume", "end"].includes(action)) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "action must be one of: pause, resume, end",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }

    let result;

    if (action === "end") {
      const status =
        body.status === "aborted" ? "aborted" : ("completed" as const);
      result = await magictodoFocusService.endSession(
        userId,
        sessionId,
        organizationId,
        teamId,
        status,
        db as DbParam
      );
    } else {
      // pause / resume -> toggleSession handles both directions
      result = await magictodoFocusService.toggleSession(
        userId,
        sessionId,
        organizationId,
        teamId,
        db as DbParam
      );
    }

    if (!result.ok) {
      const err = (
        result as unknown as { error: { code: string; message: string } }
      ).error;
      return NextResponse.json(
        kernelFail(
          {
            code:
              err.code === "NOT_FOUND"
                ? KERNEL_ERROR_CODES.NOT_FOUND
                : KERNEL_ERROR_CODES.INTERNAL,
            message: err.message,
          },
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

    return NextResponse.json(kernelOk(result.data, { traceId }), {
      status: HTTP_STATUS.OK,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to update focus session",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}