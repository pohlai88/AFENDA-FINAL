/**
 * Orchestra Kernel - Backup Download API
 * GET: Stream encrypted backup file for download
 *
 * @domain orchestra
 * @layer api/ops
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getBackup,
  retrieveBackup,
  KERNEL_HEADERS,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
} from "@afenda/orchestra";
import { fail, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/orchestra/backup/download/[id]
 * Stream backup file for download
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { id } = await context.params;

  try {
    const backupResult = await getBackup({ db }, id);
    if (!backupResult.ok) {
      const status =
        backupResult.error.code === KERNEL_ERROR_CODES.NOT_FOUND
          ? HTTP_STATUS.NOT_FOUND
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(backupResult, { status, headers });
    }

    const backup = backupResult.data;
    const retrieveResult = await retrieveBackup(
      backup.storageProvider,
      backup.storageLocation,
      backup.localFallbackPath ?? undefined
    );

    if (!retrieveResult.ok) {
      return NextResponse.json(retrieveResult, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers,
      });
    }

    const encryptedData = retrieveResult.data;
    return new Response(new Uint8Array(encryptedData), {
      status: HTTP_STATUS.OK,
      headers: {
        ...headers,
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${backup.filename}"`,
        "Content-Length": encryptedData.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to download backup",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}
