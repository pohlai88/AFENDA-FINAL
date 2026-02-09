/**
 * Orchestra Kernel - Services API (BFF - Frontend)
 * GET: UI-optimized service list with status badges
 *
 * @domain orchestra
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { listServices, HTTP_STATUS, KERNEL_HEADERS, getAuthContext } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/services/bff
 * Get services formatted for UI consumption.
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
    const result = await listServices({ db }, { traceId });
    if (!result.ok) {
      return NextResponse.json(result, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers,
      });
    }
    const uiServices = result.data.services.map((service) => ({
      ...service,
      statusLabel: getStatusLabel(service.status),
      statusColor: getStatusColor(service.status),
      lastCheckFormatted: service.lastHealthCheck
        ? formatRelativeTime(new Date(service.lastHealthCheck))
        : "Never",
    }));
    return NextResponse.json(
      ok({ services: uiServices, total: result.data.total }, { traceId }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to load services",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    registered: "Registered",
    healthy: "Healthy",
    degraded: "Degraded",
    unhealthy: "Unhealthy",
    unregistered: "Unregistered",
  };
  return labels[status] ?? status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    registered: "blue",
    healthy: "green",
    degraded: "yellow",
    unhealthy: "red",
    unregistered: "gray",
  };
  return colors[status] ?? "gray";
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
