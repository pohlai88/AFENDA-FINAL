/**
 * Orchestra Kernel Navigation Service
 * BFF aggregation of service nav manifests.
 *
 * Zero domain knowledge — fetches, validates, and merges manifests.
 */

import "server-only";

import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import { orchestraServiceRegistry, type ServiceRegistryRow } from "../drizzle/orchestra.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import { SERVICE_STATUS } from "../zod/orchestra.service.schema";
import {
  safeParseNavManifest,
  type NavManifestV1,
  type NavGroup,
} from "../zod/orchestra.nav-manifest.schema";
import { kernelLogger } from "../constant/orchestra.logger";
import {
  NAV_SERVICE_STATUS,
  type NavTree,
  type NavTreeService,
  type NavTreeUser,
  type NavTreeTenant,
  type ShellHealth,
} from "../zod/orchestra.nav-tree.schema";

export type NavServiceDeps = {
  db: NeonHttpDatabase<Record<string, unknown>>;
};

/**
 * Configuration for manifest fetching.
 */
const MANIFEST_CONFIG = {
  /** Timeout for each manifest fetch (ms) */
  TIMEOUT_MS: 5000,
  /** Maximum consecutive failures before circuit breaks */
  CIRCUIT_BREAKER_THRESHOLD: 3,
  /** Path to manifest endpoint on external services (not an internal route) */
  // eslint-disable-next-line no-restricted-syntax -- External service endpoint, not an internal route
  MANIFEST_PATH: "/api/manifest",
} as const;

/**
 * Circuit breaker state per service.
 */
const circuitBreakerState = new Map<string, { failures: number; lastFailure: number }>();

/**
 * Check if circuit breaker is open for a service.
 */
function isCircuitOpen(serviceId: string): boolean {
  const state = circuitBreakerState.get(serviceId);
  if (!state) return false;
  
  // Reset after 60 seconds
  if (Date.now() - state.lastFailure > 60000) {
    circuitBreakerState.delete(serviceId);
    return false;
  }
  
  return state.failures >= MANIFEST_CONFIG.CIRCUIT_BREAKER_THRESHOLD;
}

/**
 * Record a failure for circuit breaker.
 */
function recordFailure(serviceId: string): void {
  const state = circuitBreakerState.get(serviceId) ?? { failures: 0, lastFailure: 0 };
  state.failures++;
  state.lastFailure = Date.now();
  circuitBreakerState.set(serviceId, state);
}

/**
 * Reset circuit breaker on success.
 */
function recordSuccess(serviceId: string): void {
  circuitBreakerState.delete(serviceId);
}

/**
 * Fetch manifest from a service endpoint.
 */
async function fetchManifest(
  service: ServiceRegistryRow
): Promise<{ manifest: NavManifestV1 | null; error?: string }> {
  // Check circuit breaker
  if (isCircuitOpen(service.id)) {
    return { manifest: null, error: "Circuit breaker open" };
  }

  const url = new URL(MANIFEST_CONFIG.MANIFEST_PATH, service.endpoint).toString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MANIFEST_CONFIG.TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
      // Internal server-side fetch, no CORS issues
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      recordFailure(service.id);
      return { manifest: null, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const parsed = safeParseNavManifest(data);

    if (!parsed.success) {
      kernelLogger.warn("Nav", `Invalid manifest from ${service.id}`, {
        error: parsed.error.message,
      });
      recordFailure(service.id);
      return { manifest: null, error: "Invalid manifest schema" };
    }

    recordSuccess(service.id);
    return { manifest: parsed.data };
  } catch (error) {
    recordFailure(service.id);
    const message = error instanceof Error ? error.message : String(error);
    return { manifest: null, error: message.includes("abort") ? "Timeout" : message };
  }
}

/**
 * Filter nav items by user capabilities.
 */
function filterByCapabilities(
  groups: NavGroup[],
  capabilities: string[]
): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // No capability required = visible to all
        if (!item.capability) return true;
        // Check if user has required capability
        return capabilities.includes(item.capability);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Get the aggregated navigation tree.
 * Fetches manifests from all registered services, validates, filters by capabilities,
 * and returns a merged nav tree.
 */
export async function getNavTree(
  deps: NavServiceDeps,
  opts?: {
    traceId?: string;
    user?: NavTreeUser | null;
    tenant?: NavTreeTenant | null;
  }
): Promise<KernelEnvelope<NavTree>> {
  const { db } = deps;

  try {
    // Get all registered services
    const services = await db
      .select()
      .from(orchestraServiceRegistry);

    const activeServices = services.filter(
      (s) => s.status !== SERVICE_STATUS.UNREGISTERED
    );

    // Parallel fetch manifests
    const manifestResults = await Promise.all(
      activeServices.map(async (service) => {
        const { manifest, error } = await fetchManifest(service);
        return { service, manifest, error };
      })
    );

    // Build nav tree services
    const navServices: NavTreeService[] = manifestResults.map(
      ({ service, manifest, error }) => {
        // Determine status
        let status: NavTreeService["status"];
        if (service.status === SERVICE_STATUS.UNHEALTHY || !manifest) {
          status = NAV_SERVICE_STATUS.DOWN;
        } else if (service.status === SERVICE_STATUS.DEGRADED) {
          status = NAV_SERVICE_STATUS.DEGRADED;
        } else {
          status = NAV_SERVICE_STATUS.HEALTHY;
        }

        // Get groups (filtered by capabilities if user provided)
        let groups = manifest?.groups ?? [];
        if (opts?.user?.capabilities && opts.user.capabilities.length > 0) {
          groups = filterByCapabilities(groups, opts.user.capabilities);
        }

        // Service label from manifest or fallback to ID
        const label = manifest?.serviceId
          ? manifest.serviceId.charAt(0).toUpperCase() + manifest.serviceId.slice(1)
          : service.id.charAt(0).toUpperCase() + service.id.slice(1);

        return {
          id: service.id,
          label,
          status,
          error: error ?? undefined,
          groups,
        };
      }
    );

    const navTree: NavTree = {
      services: navServices,
      user: opts?.user ?? null,
      tenant: opts?.tenant ?? null,
      timestamp: new Date().toISOString(),
    };

    return kernelOk(navTree, { traceId: opts?.traceId });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to build navigation tree",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Get shell health summary.
 * Quick aggregate for shell health indicator.
 */
export async function getShellHealth(
  deps: NavServiceDeps,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<ShellHealth>> {
  const { db } = deps;

  try {
    const services = await db
      .select()
      .from(orchestraServiceRegistry);

    const activeServices = services.filter(
      (s) => s.status !== SERVICE_STATUS.UNREGISTERED
    );

    let healthyCount = 0;
    let degradedCount = 0;
    let downCount = 0;

    for (const service of activeServices) {
      if (service.status === SERVICE_STATUS.HEALTHY) {
        healthyCount++;
      } else if (service.status === SERVICE_STATUS.DEGRADED) {
        degradedCount++;
      } else if (service.status === SERVICE_STATUS.UNHEALTHY) {
        downCount++;
      } else {
        // REGISTERED = unknown, count as degraded
        degradedCount++;
      }
    }

    // Determine overall status
    let status: ShellHealth["status"];
    if (downCount > 0 && healthyCount === 0) {
      status = NAV_SERVICE_STATUS.DOWN;
    } else if (downCount > 0 || degradedCount > 0) {
      status = NAV_SERVICE_STATUS.DEGRADED;
    } else {
      status = NAV_SERVICE_STATUS.HEALTHY;
    }

    return kernelOk(
      {
        status,
        serviceCount: activeServices.length,
        healthyCount,
        degradedCount,
        downCount,
      },
      { traceId: opts?.traceId }
    );
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to get shell health",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}
