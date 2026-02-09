/**
 * Configuration Templates BFF API
 * UI-optimized endpoint for template browsing.
 *
 * @domain orchestra
 * @layer api/bff
 * @consumer Frontend only
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  listTemplates,
  listAllTemplates,
  KERNEL_HEADERS,
  HTTP_STATUS,
  getAuthContext,
} from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/config/templates/bff
 * List all templates (built-in + custom) with UI-optimized format
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  const auth = await getAuthContext();
  if (!auth.userId) {
    return NextResponse.json(
      fail({ code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" }, { traceId }),
      { status: HTTP_STATUS.UNAUTHORIZED, headers }
    );
  }

  try {
    const allTemplatesResult = await listAllTemplates({ db });
    if (!allTemplatesResult.ok) {
      const builtInResult = await listTemplates();
      if (!builtInResult.ok) {
        return NextResponse.json(
          fail(
            {
              code: KERNEL_ERROR_CODES.INTERNAL,
              message: "Failed to list templates",
              details: builtInResult.error.message,
            },
            { traceId }
          ),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
        );
      }
      return NextResponse.json(
        { ...builtInResult, traceId },
        { status: HTTP_STATUS.OK, headers }
      );
    }
    return NextResponse.json(
      ok(
        {
          categories: ["System", "Tenant", "Service", "Compliance"],
          templates: allTemplatesResult.data,
          presets: [] as unknown[],
        },
        { traceId }
      ),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to list templates",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
