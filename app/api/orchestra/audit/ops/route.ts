/**
 * Orchestra Kernel - Audit API (OPS - Internal)
 * GET: Query/export audit logs
 *
 * @domain orchestra
 * @layer api/ops
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  queryAuditLogs,
  HTTP_STATUS,
  KERNEL_HEADERS,
  PAGINATION,
} from "@afenda/orchestra";
import { fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/audit/ops
 * Query audit logs with full filtering and export options.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const params = request.nextUrl.searchParams;

  const eventType = params.get("eventType") ?? undefined;
  const entityType = params.get("entityType") ?? undefined;
  const entityId = params.get("entityId") ?? undefined;
  const actorId = params.get("actorId") ?? undefined;
  const startDate = params.get("startDate") ?? undefined;
  const endDate = params.get("endDate") ?? undefined;
  const limit = Math.min(
    parseInt(params.get("limit") ?? String(PAGINATION.DEFAULT_LIMIT), 10),
    PAGINATION.MAX_LIMIT
  );
  const offset = parseInt(params.get("offset") ?? String(PAGINATION.DEFAULT_OFFSET), 10);
  const format = params.get("format");

  try {
    const result = await queryAuditLogs(
      { db },
      { eventType, entityType, entityId, actorId, startDate, endDate, limit, offset },
      { traceId }
    );

    if (!result.ok) {
      return NextResponse.json(result, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers,
      });
    }

    const exportFilename = `audit-logs-${new Date().toISOString().slice(0, 10)}`;

    if (format === "csv") {
      const csv = convertToCsv(result.data.entries);
      return new NextResponse(csv, {
        status: HTTP_STATUS.OK,
        headers: {
          ...headers,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${exportFilename}.csv"`,
        },
      });
    }

    if (format === "jsonl") {
      const jsonl = result.data.entries.map((e) => JSON.stringify(e)).join("\n");
      return new NextResponse(jsonl, {
        status: HTTP_STATUS.OK,
        headers: {
          ...headers,
          "Content-Type": "application/x-ndjson",
          "Content-Disposition": `attachment; filename="${exportFilename}.jsonl"`,
        },
      });
    }

    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to query audit logs",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

 
function convertToCsv(entries: Record<string, unknown>[]): string {
  if (entries.length === 0) return "";

  const headers = [
    "id",
    "eventType",
    "entityType",
    "entityId",
    "actorId",
    "actorType",
    "createdAt",
    "traceId",
    "details",
    "previousValues",
  ];

  const rows = entries.map((entry) =>
    headers.map((h) => {
      const value = entry[h];
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value).replace(/"/g, '""');
      return String(value).replace(/"/g, '""');
    }).map((v) => `"${v}"`).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
