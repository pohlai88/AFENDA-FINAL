/**
 * Orchestra Kernel - Audit API (BFF - Frontend)
 * GET: UI-formatted audit log viewer
 *
 * @domain orchestra
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  queryAuditLogs,
  HTTP_STATUS,
  KERNEL_HEADERS,
  PAGINATION,
  getAuthContext,
} from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/audit/bff
 * Get audit logs formatted for UI viewer.
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

    const uiEntries = result.data.entries.map((entry) => ({
      ...entry,
      eventTypeLabel: formatEventType(entry.eventType),
      eventTypeIcon: getEventTypeIcon(entry.eventType),
      createdAtFormatted: formatDateTime(new Date(entry.createdAt)),
      createdAtRelative: formatRelativeTime(new Date(entry.createdAt)),
    }));

    return NextResponse.json(
      ok(
        {
          entries: uiEntries,
          total: result.data.total,
          hasMore: result.data.hasMore,
          pagination: {
            limit,
            offset,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(result.data.total / limit),
          },
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
          message: "Failed to load audit logs",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

function formatEventType(eventType: string): string {
  return eventType
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getEventTypeIcon(eventType: string): string {
  if (eventType.includes("registered")) return "plus-circle";
  if (eventType.includes("unregistered")) return "minus-circle";
  if (eventType.includes("health")) return "activity";
  if (eventType.includes("config")) return "settings";
  if (eventType.includes("backup")) return "download";
  if (eventType.includes("restore")) return "upload";
  return "file-text";
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) return "Just now";
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  return `${Math.floor(diffSecs / 86400)}d ago`;
}
