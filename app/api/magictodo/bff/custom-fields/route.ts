/**
 * Magictodo BFF - Custom field definitions (aligns with /api/magictodo/bff/custom-fields)
 * GET: List custom field definitions for the authenticated user
 * POST: Create a new field definition (stub - returns 501 for now)
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

/**
 * GET /api/magictodo/bff/custom-fields
 * List custom field definitions. Returns empty list until a proper store is wired.
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

    // Stub: return empty list until custom field definitions store is implemented.
    // Definitions may later come from project-level customFields or a dedicated table.
    return NextResponse.json(
      {
        ok: true,
        data: {
          items: [],
          total: 0,
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
          message: "Failed to list custom fields",
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

/**
 * POST /api/magictodo/bff/custom-fields
 * Create a new field definition. Returns 501 until implementation.
 */
export async function POST(request: NextRequest) {
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

    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Custom field creation not yet implemented",
        },
        { traceId }
      ),
      {
        status: HTTP_STATUS.NOT_IMPLEMENTED,
        headers: { [KERNEL_HEADERS.TRACE_ID]: traceId },
      }
    );
  } catch (error) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to create custom field",
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
