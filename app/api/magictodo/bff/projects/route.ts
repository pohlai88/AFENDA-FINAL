/**
 * Magictodo BFF - Projects list (aligns with routes.api.magictodo.bff.projects())
 * GET: UI-optimized project list for app shell and project views
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
import { magictodoProjectService } from "@afenda/magictodo/server";
import { db } from "@afenda/shared/server/db";

type DbParam = Parameters<typeof magictodoProjectService.list>[5];

/**
 * GET /api/magictodo/bff/projects
 * List projects formatted for UI (optional archived filter, pagination).
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

    const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 50), 100);
    const offset = Number(request.nextUrl.searchParams.get("offset") ?? 0);

    const result = await magictodoProjectService.list(
      userId,
      null,
      null,
      includeArchived,
      { limit, offset },
      db as DbParam
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
        data: {
          ...result.data,
          projects: result.data?.items ?? [],
        },
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
          message: "Failed to list projects",
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
