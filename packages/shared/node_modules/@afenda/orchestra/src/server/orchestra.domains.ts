/**
 * Orchestra App Domains Registry
 * Fetches available app domains for the shell sidebar (same pattern as service registry).
 *
 * Zero domain knowledge — reads from orchestra_app_domains table.
 */

import "server-only";

import type { Database } from "@afenda/shared/server/db";
import { asc, eq } from "drizzle-orm";

import { orchestraAppDomains } from "../drizzle/orchestra.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import type { AppDomainEntry } from "../zod/orchestra.nav-tree.schema";

export type AppDomainsDeps = {
  db: Database;
};

/**
 * Get available app domains for the sidebar.
 * Returns enabled domains ordered by sort_order (same pattern as kernel fetching services).
 */
export async function getAvailableDomains(
  deps: AppDomainsDeps,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<AppDomainEntry[]>> {
  const { db } = deps;

  try {
    const rows = await db
      .select({
        id: orchestraAppDomains.id,
        label: orchestraAppDomains.label,
        href: orchestraAppDomains.href,
        icon: orchestraAppDomains.icon,
        description: orchestraAppDomains.description,
      })
      .from(orchestraAppDomains)
      .where(eq(orchestraAppDomains.enabled, true))
      .orderBy(asc(orchestraAppDomains.sortOrder), asc(orchestraAppDomains.id));

    const domains: AppDomainEntry[] = rows.map((r) => ({
      id: r.id,
      label: r.label,
      href: r.href,
      icon: r.icon,
      ...(r.description != null && { description: r.description }),
    }));

    return kernelOk(domains, { traceId: opts?.traceId });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to fetch available domains",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}
