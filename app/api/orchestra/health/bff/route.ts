/**
 * Orchestra Kernel - Health API (BFF - Frontend)
 * GET: UI-optimized aggregated status dashboard
 *
 * @domain orchestra
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  checkAllServiceHealth,
  HTTP_STATUS,
  KERNEL_HEADERS,
  SYSTEM_HEALTH_STATUS,
} from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/health/bff
 * Get system health formatted for UI dashboard.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  try {
    const result = await checkAllServiceHealth({ db }, { traceId });

    if (!result.ok) {
      return NextResponse.json(result, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers,
      });
    }

    const dashboard = {
      overallStatus: result.data.status,
      overallStatusLabel: getStatusLabel(result.data.status),
      overallStatusColor: getStatusColor(result.data.status),
      uptimeFormatted: formatUptime(result.data.uptime),
      timestamp: result.data.timestamp,
      services: result.data.services.map((s) => ({
        id: s.serviceId,
        status: s.status,
        statusLabel: getStatusLabel(s.status),
        statusColor: getStatusColor(s.status),
        latency: s.latencyMs ? `${s.latencyMs}ms` : "N/A",
        lastCheck: formatRelativeTime(new Date(s.lastCheck)),
        error: s.error,
      })),
      summary: {
        ...result.data.summary,
        healthPercentage: result.data.summary.total > 0
          ? Math.round((result.data.summary.healthy / result.data.summary.total) * 100)
          : 100,
      },
    };

    return NextResponse.json(ok(dashboard, { traceId }), {
      status: HTTP_STATUS.OK,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to load health dashboard",
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
    [SYSTEM_HEALTH_STATUS.HEALTHY]: "All Systems Operational",
    [SYSTEM_HEALTH_STATUS.DEGRADED]: "Partial Outage",
    [SYSTEM_HEALTH_STATUS.DOWN]: "Major Outage",
  };
  return labels[status] ?? status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    [SYSTEM_HEALTH_STATUS.HEALTHY]: "green",
    [SYSTEM_HEALTH_STATUS.DEGRADED]: "yellow",
    [SYSTEM_HEALTH_STATUS.DOWN]: "red",
  };
  return colors[status] ?? "gray";
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
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
