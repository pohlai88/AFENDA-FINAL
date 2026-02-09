/**
 * MagicDrive v1 - Hash audit (aligns with routes.api.magicdrive.v1.auditHash())
 * GET: Sample document versions, verify SHA-256 against storage. Query: sample (1–100).
 *
 * @domain magicdrive
 * @layer api/v1
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_STATUS, KERNEL_HEADERS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import type { AuditHashResult } from "@afenda/magicdrive/zod";

const AUDIT_SAMPLE_DEFAULT = 20;
const AUDIT_SAMPLE_MIN = 1;
const AUDIT_SAMPLE_MAX = 100;

/**
 * GET /api/magicdrive/v1/audit/hash?sample=20
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const auth = await getAuthContext();
    const _userId = auth.userId ?? undefined;
    if (!_userId) {
      return NextResponse.json(
        fail(
          { code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" },
          { traceId }
        ),
        { status: HTTP_STATUS.UNAUTHORIZED, headers }
      );
    }

    const sampleParam = request.nextUrl.searchParams.get("sample");
    const sample = Math.min(
      AUDIT_SAMPLE_MAX,
      Math.max(AUDIT_SAMPLE_MIN, Number(sampleParam) || AUDIT_SAMPLE_DEFAULT)
    );

    // TODO: Implement actual R2 + DB hash comparison when storage/DB layer is ready.
    // For now return a stable contract so the audit UI works.
    const result: AuditHashResult = {
      sampled: sample,
      checked: 0,
      matched: 0,
      mismatched: [],
      errors: [],
    };

    return NextResponse.json(ok(result, { traceId }), {
      status: HTTP_STATUS.OK,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Audit failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
