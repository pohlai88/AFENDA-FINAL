/**
 * Magictodo BFF - Focus stats (aligns with routes.api.magictodo.bff.focus.stats())
 * GET: Focus statistics for the authenticated user (period: today | week | month | all)
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

type DbParam = Parameters<typeof magictodoFocusService.getStats>[4];

type Period = "today" | "week" | "month" | "all";

/**
 * GET /api/magictodo/bff/focus/stats?period=today|week|month|all
 * Get focus statistics for the given period.
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

    const periodParam = request.nextUrl.searchParams.get("period");
    const period: Period =
      periodParam && ["today", "week", "month", "all"].includes(periodParam)
        ? (periodParam as Period)
        : "all";

    const result = await magictodoFocusService.getStats(
      userId,
      organizationId,
      teamId,
      period,
      db as DbParam
    );

    if (!result.ok) {
      const err = (result as unknown as { error: { code: string; message: string } }).error;
      return NextResponse.json(
        kernelFail(
          {
            code: err?.code === "NOT_FOUND" ? KERNEL_ERROR_CODES.NOT_FOUND : KERNEL_ERROR_CODES.INTERNAL,
            message: err?.message ?? "Failed to get focus stats",
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
          message: "Failed to get focus stats",
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
