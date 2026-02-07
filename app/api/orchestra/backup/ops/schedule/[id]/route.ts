/**
 * Orchestra Kernel - Backup Schedule by ID
 * PATCH: Update schedule (e.g. enabled)
 * DELETE: Delete schedule
 *
 * @domain orchestra
 * @layer api/ops
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  updateBackupSchedule,
  deleteBackupSchedule,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
} from "@afenda/orchestra";
import { fail, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";
import { z } from "zod";

const UpdateScheduleSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().min(1).optional(),
  cronExpression: z.string().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      fail({ code: KERNEL_ERROR_CODES.VALIDATION, message: "Schedule ID required" }, { traceId }),
      { status: HTTP_STATUS.BAD_REQUEST, headers }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = UpdateScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid update input",
            details: parsed.error.flatten(),
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await updateBackupSchedule({ db }, id, parsed.data);
    const status = result.ok
      ? HTTP_STATUS.OK
      : result.error?.code === KERNEL_ERROR_CODES.NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json(result, { status, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to update backup schedule",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const traceId = _request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      fail({ code: KERNEL_ERROR_CODES.VALIDATION, message: "Schedule ID required" }, { traceId }),
      { status: HTTP_STATUS.BAD_REQUEST, headers }
    );
  }
  try {
    const result = await deleteBackupSchedule({ db }, id);
    const status = result.ok
      ? HTTP_STATUS.OK
      : result.error?.code === KERNEL_ERROR_CODES.NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json(result, { status, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to delete backup schedule",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
