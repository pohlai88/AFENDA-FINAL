/**
 * Tenancy BFF - Memberships list (aligns with routes.api.tenancy.memberships.bff.list())
 * GET: List org and standalone team memberships for user
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
} from "@afenda/orchestra";
import { isTenancyTableMissingError } from "@afenda/tenancy";
import { tenancyMembershipService, withAuth } from "@afenda/tenancy/server";
import { tenancyMembershipQuerySchema } from "@afenda/tenancy/zod";
import { parseSearchParams } from "@afenda/shared/server/validate";

export const GET = withAuth(async (request: NextRequest, authContext) => {
  const traceId =
    request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const query = parseSearchParams(
      request.nextUrl.searchParams,
      tenancyMembershipQuerySchema
    );
    const result = await tenancyMembershipService.listForUser(authContext.userId, query);
    return NextResponse.json(kernelOk(result, { traceId }), {
      status: HTTP_STATUS.OK,
      headers: {
        [KERNEL_HEADERS.REQUEST_ID]: traceId,
        [KERNEL_HEADERS.TRACE_ID]: traceId,
      },
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
        headers: {
          [KERNEL_HEADERS.REQUEST_ID]: traceId,
          [KERNEL_HEADERS.TRACE_ID]: traceId,
        },
      }
    );
  }
});
