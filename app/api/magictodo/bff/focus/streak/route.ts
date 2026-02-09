/**
 * Magictodo BFF - Focus streak (aligns with routes.api.magictodo.bff.focus.streak())
 * GET: Focus streak statistics for the authenticated user
 *
 * @domain magictodo
 * @layer api/bff
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

type DbParam = Parameters<typeof magictodoFocusService.getStreak>[3];

/**
 * GET /api/magictodo/bff/focus/streak
 * Get focus streak statistics (current streak, longest streak, active days).
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
          {
            code: KERNEL_ERROR_CODES.UNAUTHORIZED,
            message: "Authentication required",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    const organizationId = request.headers.get(TENANT_HEADERS.ORG_ID) ?? null;
    const teamId = request.headers.get(TENANT_HEADERS.TEAM_ID) ?? null;

    const result = await magictodoFocusService.getStreak(userId, organizationId, teamId, db as DbParam);

    if (!result.ok) {
      const err = (result as unknown as { error: { code: string; message: string } }).error;
      return NextResponse.json(
        kernelFail(
          {
            code: err?.code === "NOT_FOUND" ? KERNEL_ERROR_CODES.NOT_FOUND : KERNEL_ERROR_CODES.INTERNAL,
            message: err?.message ?? "Failed to get focus streak",
          },
          { traceId }
        ),
        {
          status: err?.code === "NOT_FOUND" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers,
        }
      );
    }

    return NextResponse.json(
      kernelOk(result.data, { traceId }),
      {
        status: HTTP_STATUS.OK,
        headers,
      }
    );
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to get focus streak",
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
