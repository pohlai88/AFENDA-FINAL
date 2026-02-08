/**
 * Tenancy BFF - Team members (aligns with routes.api.tenancy.teams.bff.members(id))
 * GET: List team members (org-scoped or standalone)
 * POST: Add member to team; validate min 2 members for team
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
import {
  isTenancyTableMissingError,
  TENANCY_CONSTANTS,
} from "@afenda/tenancy";
import {
  tenancyTeamService,
  tenancyMembershipService,
} from "@afenda/tenancy/server";
import { tenancyCreateTeamMembershipSchema } from "@afenda/tenancy/zod";
import { parseJson } from "@afenda/shared/server/validate";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const traceId =
    request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const { id: teamId } = await params;

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
        {
          status: HTTP_STATUS.UNAUTHORIZED,
          headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    const team = await tenancyTeamService.getById(teamId);
    if (!team) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Team not found" },
          { traceId }
        ),
        {
          status: HTTP_STATUS.NOT_FOUND,
          headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    const members = await tenancyMembershipService.listTeamMembers(teamId);
    return NextResponse.json(kernelOk({ items: members }, { traceId }), {
      status: HTTP_STATUS.OK,
      headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
    });
  } catch (err) {
    const message = isTenancyTableMissingError(err)
      ? "Tenancy tables not found. Run: pnpm db:migrate"
      : (err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      kernelFail(
        { code: KERNEL_ERROR_CODES.INTERNAL, message },
        { traceId }
      ),
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
      }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const traceId =
    request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const { id: teamId } = await params;

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
        {
          status: HTTP_STATUS.UNAUTHORIZED,
          headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    const team = await tenancyTeamService.getById(teamId);
    if (!team) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.NOT_FOUND, message: "Team not found" },
          { traceId }
        ),
        {
          status: HTTP_STATUS.NOT_FOUND,
          headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    if (team.organizationId !== null) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message:
              "Adding members via this endpoint is only supported for standalone teams",
          },
          { traceId }
        ),
        {
          status: HTTP_STATUS.BAD_REQUEST,
          headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    const body = await parseJson(request, tenancyCreateTeamMembershipSchema);
    if (body.teamId !== teamId) {
      return NextResponse.json(
        kernelFail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Team ID in body does not match route",
          },
          { traceId }
        ),
        {
          status: HTTP_STATUS.BAD_REQUEST,
          headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    const minMembers = TENANCY_CONSTANTS.CORE?.MIN_TEAM_MEMBERS ?? 2;

    const membership = await tenancyMembershipService.createTeamMembership(
      teamId,
      body.userId,
      body.role
    );
    const newCount = await tenancyTeamService.getMemberCount(teamId);
    if (newCount < minMembers) {
      return NextResponse.json(
        kernelOk(
          {
            ...membership,
            joinedAt: membership.joinedAt?.toISOString() ?? "",
            warning: `Team has ${newCount} member(s). Minimum ${minMembers} recommended.`,
          },
          { traceId }
        ),
        {
          status: HTTP_STATUS.CREATED,
          headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
        }
      );
    }

    return NextResponse.json(
      kernelOk(
        {
          ...membership,
          joinedAt: membership.joinedAt?.toISOString() ?? "",
        },
        { traceId }
      ),
      {
        status: HTTP_STATUS.CREATED,
        headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to add team member";
    return NextResponse.json(
      kernelFail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message },
        { traceId }
      ),
      {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
      }
    );
  }
}
