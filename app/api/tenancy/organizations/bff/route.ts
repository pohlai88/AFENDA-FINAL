/**
 * Tenancy BFF - Organizations list/create (aligns with routes.api.tenancy.organizations.bff.list())
 * GET: List organizations for user
 * POST: Create organization
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
import { tenancyOrganizationService } from "@afenda/tenancy/server";
import {
  tenancyCreateOrganizationSchema,
  tenancyOrganizationQuerySchema,
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

    const query = parseSearchParams(
      request.nextUrl.searchParams,
      tenancyOrganizationQuerySchema
    );
    const result = await tenancyOrganizationService.listForUser(userId, query);
    return NextResponse.json(kernelOk(result, { traceId }), {
      status: HTTP_STATUS.OK,
      headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const isMissingTable = /relation ["']tenancy_/i.test(raw) || /does not exist/i.test(raw);
    const message = isMissingTable
      ? "Tenancy tables not found. Run: pnpm db:migrate"
      : raw;
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await parseJson(request, tenancyCreateOrganizationSchema);
    const org = await tenancyOrganizationService.create(body, userId);
    return NextResponse.json(
      kernelOk(
        {
          ...org,
          createdAt: org.createdAt?.toISOString() ?? "",
          updatedAt: org.updatedAt?.toISOString() ?? "",
        },
        { traceId }
      ),
      { status: HTTP_STATUS.CREATED, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create organization";
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.VALIDATION, message }, { traceId }),
      { status: HTTP_STATUS.BAD_REQUEST, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}
