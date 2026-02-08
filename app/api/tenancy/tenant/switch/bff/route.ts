/**
 * Tenancy BFF - Tenant Switch
 * POST: Set active tenant context (org or team) in session cookie
 *
 * @domain tenancy
 * @layer api/bff
 * Phase 4: Tenant context persistence
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  kernelFail,
  kernelOk,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getAuthContext,
} from "@afenda/orchestra";
import { parseJson } from "@afenda/shared/server/validate";
import { z } from "zod";

const switchTenantSchema = z.object({
  type: z.enum(["org", "team"]),
  id: z.string().min(1, "Tenant ID is required"),
  organizationId: z.string().optional(), // For teams within orgs
});

/**
 * POST: Switch active tenant context
 * Sets cookies for tenant headers that will be read by middleware
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    // Check authentication
    const auth = await getAuthContext();
    if (!auth.userId) {
      return NextResponse.json(
        kernelFail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Authentication required" },
          { traceId }
        ),
        {
          status: HTTP_STATUS.UNAUTHORIZED,
          headers: {
            [KERNEL_HEADERS.REQUEST_ID]: traceId,
            [KERNEL_HEADERS.TRACE_ID]: traceId,
          },
        }
      );
    }

    const body = await request.json();
    const input = await parseJson(body, switchTenantSchema);

    // Set cookies based on tenant type
    const cookieStore = await cookies();
    
    if (input.type === "org") {
      cookieStore.set("activeTenantOrgId", input.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      // Clear team cookie when switching to org-only context
      cookieStore.delete("activeTenantTeamId");
    } else {
      // Switching to team
      cookieStore.set("activeTenantTeamId", input.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      
      // If team belongs to an org, also set org cookie
      // Otherwise, clear it (standalone team)
      if (input.organizationId) {
        cookieStore.set("activeTenantOrgId", input.organizationId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      } else {
        cookieStore.delete("activeTenantOrgId");
      }
    }

    return NextResponse.json(
      kernelOk({ success: true }, { traceId }),
      {
        status: HTTP_STATUS.OK,
        headers: {
          [KERNEL_HEADERS.REQUEST_ID]: traceId,
          [KERNEL_HEADERS.TRACE_ID]: traceId,
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: {
          [KERNEL_HEADERS.REQUEST_ID]: traceId,
          [KERNEL_HEADERS.TRACE_ID]: traceId,
        },
      }
    );
  }
}
