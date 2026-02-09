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
  kernelOk,
  kernelFail,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { envelopeHeaders } from "@afenda/shared/server";

/**
 * GET /api/magictodo/bff/custom-fields
 * List custom field definitions. Returns empty list until a proper store is wired.
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

    // Stub: return empty list until custom field definitions store is implemented.
    // Definitions may later come from project-level customFields or a dedicated table.
    return NextResponse.json(
      kernelOk({ items: [], total: 0 }, { traceId }),
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
          message: "Failed to list custom fields",
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

/**
 * POST /api/magictodo/bff/custom-fields
 * Create a new field definition. Returns 501 until implementation.
 */
export async function POST(request: NextRequest) {
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
        headers,
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
        headers,
      }
    );
  }
}
