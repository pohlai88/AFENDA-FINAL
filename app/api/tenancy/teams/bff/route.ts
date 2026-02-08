/**
 * Tenancy BFF - Teams list/create (aligns with routes.api.tenancy.teams.bff.list())
 * GET: List teams for user
 * POST: Create team
 *
 * @domain tenancy
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  kernelFail,
  kernelOk,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { isTenancyTableMissingError } from "@afenda/tenancy";
import { tenancyTeamService, tenancyAuditService, withRateLimit, teamCreationLimiter } from "@afenda/tenancy/server";
import {
  tenancyCreateTeamSchema,
  tenancyTeamQuerySchema,
} from "@afenda/tenancy/zod";
import { parseJson, parseSearchParams } from "@afenda/shared/server/validate";

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
        { status: HTTP_STATUS.UNAUTHORIZED, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    const query = parseSearchParams(request.nextUrl.searchParams, tenancyTeamQuerySchema);
    const result = await tenancyTeamService.list(query, userId);
    return NextResponse.json(kernelOk(result, { traceId }), {
      status: HTTP_STATUS.OK,
      headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
    });
  } catch (err) {
    const message = isTenancyTableMissingError(err)
      ? "Tenancy tables not found. Run: pnpm db:migrate"
      : (err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}

export const POST = withRateLimit(async (request: NextRequest) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const auth = await getAuthContext();
    if (!auth.userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    const body = await parseJson(request, tenancyCreateTeamSchema);
    const team = await tenancyTeamService.create(body);

    // Audit log: team creation
    await tenancyAuditService.log({
      actorId: auth.userId,
      action: "team.create",
      resourceType: "team",
      resourceId: team.id,
      metadata: {
        teamName: team.name,
        organizationId: body.organizationId ?? null,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json(
      kernelOk(
        {
          ...team,
          createdAt: team.createdAt?.toISOString() ?? "",
          updatedAt: team.updatedAt?.toISOString() ?? "",
        },
        { traceId }
      ),
      { status: HTTP_STATUS.CREATED, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create team";
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.VALIDATION, message }, { traceId }),
      { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}, teamCreationLimiter);
