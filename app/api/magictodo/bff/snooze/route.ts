/**
 * Magictodo BFF - Snooze operations (aligns with routes.api.magictodo.bff.snooze())
 * POST: Snooze a task until a specific date/condition
 * DELETE: Unsnooze a task
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
import { magictodoSnoozeService } from "@afenda/magictodo/server";
import { db } from "@afenda/shared/server/db";
import { TENANT_HEADERS } from "@afenda/tenancy/server";

type DbParam = Parameters<typeof magictodoSnoozeService.snoozeTask>[5];

/**
 * POST /api/magictodo/bff/snooze
 * Snooze a task until a given datetime.
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

    if (!body.taskId) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "taskId is required",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }

    // Resolve snoozedUntil from preset or explicit datetime
    let snoozedUntil: Date;
    if (body.snoozedUntil) {
      snoozedUntil = new Date(body.snoozedUntil);
    } else if (body.preset) {
      snoozedUntil = resolveSnoozePreset(body.preset);
    } else {
      // Default: tomorrow morning 9am
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      snoozedUntil = tomorrow;
    }

    const result = await magictodoSnoozeService.snoozeTask(
      userId,
      body.taskId,
      organizationId,
      teamId,
      {
        snoozedUntil,
        reason: body.reason,
        dependencyTaskId: body.dependencyTaskId,
      },
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
              err.code === "TASK_NOT_FOUND"
                ? KERNEL_ERROR_CODES.NOT_FOUND
                : KERNEL_ERROR_CODES.INTERNAL,
            message: err.message,
          },
          { traceId }
        ),
        {
          status:
            err.code === "TASK_NOT_FOUND"
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
          message: "Failed to snooze task",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * DELETE /api/magictodo/bff/snooze
 * Unsnooze a task.
 */
export async function DELETE(request: NextRequest) {
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

    if (!body.taskId) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "taskId is required",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }

    const result = await magictodoSnoozeService.unsnoozeTask(
      userId,
      body.taskId,
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
              err.code === "NOT_SNOOZED"
                ? KERNEL_ERROR_CODES.NOT_FOUND
                : KERNEL_ERROR_CODES.INTERNAL,
            message: err.message,
          },
          { traceId }
        ),
        {
          status:
            err.code === "NOT_SNOOZED"
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
          message: "Failed to unsnooze task",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveSnoozePreset(preset: string): Date {
  const now = new Date();

  switch (preset) {
    case "later_today": {
      const d = new Date(now);
      d.setHours(d.getHours() + 3);
      return d;
    }
    case "tonight": {
      const d = new Date(now);
      d.setHours(19, 0, 0, 0);
      if (d <= now) d.setDate(d.getDate() + 1);
      return d;
    }
    case "tomorrow_morning": {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    }
    case "tomorrow_afternoon": {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(14, 0, 0, 0);
      return d;
    }
    case "next_week": {
      const d = new Date(now);
      const daysUntilMonday = ((8 - d.getDay()) % 7) || 7;
      d.setDate(d.getDate() + daysUntilMonday);
      d.setHours(9, 0, 0, 0);
      return d;
    }
    case "next_weekend": {
      const d = new Date(now);
      const daysUntilSaturday = ((6 - d.getDay()) % 7) || 7;
      d.setDate(d.getDate() + daysUntilSaturday);
      d.setHours(10, 0, 0, 0);
      return d;
    }
    default: {
      // Fallback: tomorrow 9am
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    }
  }
}
