/**
 * Orchestra Kernel - Config API (BFF - Frontend)
 * GET: UI-formatted config list for admin panel
 *
 * @domain orchestra
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { listConfigs, HTTP_STATUS, KERNEL_HEADERS } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";

/**
 * GET /api/orchestra/config/bff
 * Get configs formatted for admin settings panel.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const prefix = request.nextUrl.searchParams.get("prefix") ?? undefined;

  try {
    const result = await listConfigs({ db }, { prefix, traceId });
    if (!result.ok) {
      return NextResponse.json(result, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers,
      });
    }

    // Transform configs for UI with additional fields
    type ConfigWithMeta = {
      key: string;
      value?: unknown;
      description: string | null;
      createdAt: string;
      updatedAt: string;
      updatedBy: string | null;
      valuePreview: string;
      lastUpdatedFormatted: string;
    };

    // Group configs by namespace (prefix before first dot)
    const grouped = new Map<string, ConfigWithMeta[]>();

    for (const config of result.data.configs) {
      const dotIndex = config.key.indexOf(".");
      const namespace = dotIndex > 0 ? config.key.substring(0, dotIndex) : "general";

      if (!grouped.has(namespace)) {
        grouped.set(namespace, []);
      }
      grouped.get(namespace)!.push({
        ...config,
        valuePreview: getValuePreview(config.value),
        lastUpdatedFormatted: formatRelativeTime(new Date(config.updatedAt)),
      });
    }

    const namespaces = Array.from(grouped.entries()).map(([name, configs]) => ({
      name,
      label: capitalizeFirst(name),
      configs,
      count: configs.length,
    }));

    return NextResponse.json(
      ok({ namespaces, total: result.data.total }, { traceId }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to load config panel",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

function getValuePreview(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 50 ? value.substring(0, 50) + "..." : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === "object" && value !== null) {
    return `{${Object.keys(value).length} keys}`;
  }
  return "null";
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
