/**
 * Magictodo BFF - Focus session complete task
 * POST: Complete the current task in the active focus session and advance to next
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
  type KernelErrorCode,
} from "@afenda/orchestra";
import { envelopeHeaders } from "@afenda/shared/server";
import { magictodoFocusService } from "@afenda/magictodo/server";
import { db } from "@afenda/shared/server/db";
import { TENANT_HEADERS } from "@afenda/tenancy/server";

type DbParam = Parameters<typeof magictodoFocusService.completeTask>[4];

/**
 * POST /api/magictodo/bff/focus/session/complete
 * Complete current focus task and advance to next in queue.
 * Body: { sessionId: string, taskId: string }
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

    if (!body.sessionId) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "sessionId is required",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }

    const result = await magictodoFocusService.completeTask(
      userId,
      body.sessionId,
      organizationId,
      teamId,
      db as DbParam
    );

    if (!result.ok) {
      const err = (
        result as unknown as { error: { code: string; message: string } }
      ).error;
      const errorMap: Record<string, { code: KernelErrorCode; status: number }> = {
        NO_ACTIVE_SESSION: {
          code: KERNEL_ERROR_CODES.NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND,
        },
        NO_CURRENT_TASK: {
          code: KERNEL_ERROR_CODES.VALIDATION,
          status: HTTP_STATUS.BAD_REQUEST,
        },
      };
      const mapped = errorMap[err.code] ?? {
        code: KERNEL_ERROR_CODES.INTERNAL,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      };
      return NextResponse.json(
        kernelFail(
          { code: mapped.code, message: err.message },
          { traceId }
        ),
        { status: mapped.status, headers }
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
          message: "Failed to complete focus task",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
