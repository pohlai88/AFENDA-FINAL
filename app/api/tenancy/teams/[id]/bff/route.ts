/**
 * Tenancy BFF - Team by id (aligns with routes.api.tenancy.teams.bff.byId(id))
 * GET: Get team
 * PATCH: Update team
 * DELETE: Delete team
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
import { tenancyTeamService } from "@afenda/tenancy/server";
import { tenancyUpdateTeamSchema } from "@afenda/tenancy/zod";
import { parseJson } from "@afenda/shared/server/validate";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const { id } = await params;

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

    const team = await tenancyTeamService.getById(id);
    if (!team) {
      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Team not found" }, { traceId }),
        { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    return NextResponse.json(
      kernelOk(
        {
          ...team,
          createdAt: team.createdAt?.toISOString() ?? "",
          updatedAt: team.updatedAt?.toISOString() ?? "",
        },
        { traceId }
      ),
      { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get team";
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const { id } = await params;

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

    const body = await parseJson(request, tenancyUpdateTeamSchema);
    const team = await tenancyTeamService.update(id, body);
    if (!team) {
      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Team not found" }, { traceId }),
        { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    return NextResponse.json(
      kernelOk(
        {
          ...team,
          createdAt: team.createdAt?.toISOString() ?? "",
          updatedAt: team.updatedAt?.toISOString() ?? "",
        },
        { traceId }
      ),
      { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update team";
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.VALIDATION, message }, { traceId }),
      { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const { id } = await params;

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

    const deleted = await tenancyTeamService.delete(id);
    if (!deleted) {
      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Team not found" }, { traceId }),
        { status: HTTP_STATUS.NOT_FOUND, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }

    return NextResponse.json(
      kernelOk({ deleted: true }, { traceId }),
      { status: HTTP_STATUS.OK, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete team";
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}
