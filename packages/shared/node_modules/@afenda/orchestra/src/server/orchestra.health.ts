/**
 * Orchestra Kernel Health Service
 * System health aggregation across registered services.
 *
 * Zero domain knowledge — just pings endpoints, no awareness of what they do.
 */

import "server-only";

import {
  orchestraServiceRegistry,
  type ServiceRegistryRow,
  AUDIT_EVENT_TYPES,
} from "../drizzle/orchestra.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import {
  SYSTEM_HEALTH_STATUS,
  type SystemHealthResponse,
  type ServiceHealthResult,
  type HealthCheckResponse,
  type DiagnosticsResponse,
} from "../zod/orchestra.health.schema";
import { SERVICE_STATUS } from "../zod/orchestra.service.schema";
import { updateServiceStatus, type DiscoveryServiceDeps } from "./orchestra.discovery";
import { logAudit } from "./orchestra.audit";
import { recordHealthCheck } from "./orchestra.health-history";

// Track kernel start time for uptime calculation
const KERNEL_START_TIME = Date.now();

export type HealthServiceDeps = DiscoveryServiceDeps;

/**
 * Ping a service's health endpoint.
 */
async function pingService(
  endpoint: string,
  healthCheckPath: string,
  timeoutMs = 5000
): Promise<{ status: string; latencyMs: number; error?: string }> {
  const url = new URL(healthCheckPath, endpoint).toString();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      return { status: SYSTEM_HEALTH_STATUS.HEALTHY, latencyMs };
    } else if (response.status >= 500) {
      return {
        status: SYSTEM_HEALTH_STATUS.DOWN,
        latencyMs,
        error: `HTTP ${response.status}`,
      };
    } else {
      return {
        status: SYSTEM_HEALTH_STATUS.DEGRADED,
        latencyMs,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("abort")) {
      return { status: SYSTEM_HEALTH_STATUS.DOWN, latencyMs, error: "Timeout" };
    }

    return { status: SYSTEM_HEALTH_STATUS.DOWN, latencyMs, error: errorMessage };
  }
}

/**
 * Check health of all registered services and update their status.
 */
export async function checkAllServiceHealth(
  deps: HealthServiceDeps,
  opts?: { traceId?: string; timeoutMs?: number }
): Promise<KernelEnvelope<SystemHealthResponse>> {
  const { db } = deps;

  try {
    const services = await db.select().from(orchestraServiceRegistry);

    const results: ServiceHealthResult[] = [];
    let healthyCount = 0;
    let degradedCount = 0;
    let downCount = 0;

    // Check each service in parallel
    const healthChecks = await Promise.all(
      services.map(async (service: ServiceRegistryRow) => {
        const pingResult = await pingService(
          service.endpoint,
          service.healthCheck,
          opts?.timeoutMs
        );

        // Map ping status to service status
        let serviceStatus: string;
        if (pingResult.status === SYSTEM_HEALTH_STATUS.HEALTHY) {
          serviceStatus = SERVICE_STATUS.HEALTHY;
          healthyCount++;
        } else if (pingResult.status === SYSTEM_HEALTH_STATUS.DEGRADED) {
          serviceStatus = SERVICE_STATUS.DEGRADED;
          degradedCount++;
        } else {
          serviceStatus = SERVICE_STATUS.UNHEALTHY;
          downCount++;
        }

        // Update service status in DB if changed
        const previousStatus = service.status;
        if (previousStatus !== serviceStatus) {
          await updateServiceStatus(deps, service.id, serviceStatus, {
            latencyMs: pingResult.latencyMs,
            error: pingResult.error,
          });

          // Log status change
          await logAudit(deps, {
            eventType: AUDIT_EVENT_TYPES.SERVICE_HEALTH_CHANGED,
            entityType: "service",
            entityId: service.id,
            details: { newStatus: serviceStatus, latencyMs: pingResult.latencyMs },
            previousValues: { status: previousStatus },
            traceId: opts?.traceId,
          });
        }

        // Record health check to history (for timeline and uptime calculations)
        await recordHealthCheck(deps, {
          serviceId: service.id,
          status: pingResult.status as "healthy" | "degraded" | "down",
          latencyMs: pingResult.latencyMs,
          errorMessage: pingResult.error,
        }, { traceId: opts?.traceId });

        return {
          serviceId: service.id,
          status: pingResult.status as ServiceHealthResult["status"],
          latencyMs: pingResult.latencyMs,
          lastCheck: new Date().toISOString(),
          error: pingResult.error ?? null,
        };
      })
    );

    results.push(...healthChecks);

    // Determine overall system status
    let systemStatus: SystemHealthResponse["status"];
    if (downCount > 0 && healthyCount === 0) {
      systemStatus = SYSTEM_HEALTH_STATUS.DOWN;
    } else if (downCount > 0 || degradedCount > 0) {
      systemStatus = SYSTEM_HEALTH_STATUS.DEGRADED;
    } else {
      systemStatus = SYSTEM_HEALTH_STATUS.HEALTHY;
    }

    const response: SystemHealthResponse = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - KERNEL_START_TIME) / 1000),
      services: results,
      summary: {
        total: services.length,
        healthy: healthyCount,
        degraded: degradedCount,
        down: downCount,
      },
    };

    return kernelOk(response, { traceId: opts?.traceId });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to check system health",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Get simple health check response (v1 endpoint).
 */
export async function getHealthCheck(
  deps: HealthServiceDeps,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<HealthCheckResponse>> {
  const { db } = deps;

  try {
    // Quick check - just test DB connection
    await db.select().from(orchestraServiceRegistry).limit(1);

    return kernelOk(
      {
        status: SYSTEM_HEALTH_STATUS.HEALTHY,
        timestamp: new Date().toISOString(),
      },
      { traceId: opts?.traceId }
    );
  } catch (_error) {
    return kernelOk(
      {
        status: SYSTEM_HEALTH_STATUS.DOWN,
        timestamp: new Date().toISOString(),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Get detailed diagnostics response (ops endpoint).
 */
export async function getDiagnostics(
  deps: HealthServiceDeps,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<DiagnosticsResponse>> {
  try {
    // Check all services
    const healthResult = await checkAllServiceHealth(deps, opts);

    if (!healthResult.ok) {
      return healthResult as KernelEnvelope<DiagnosticsResponse>;
    }

    const diagnostics: DiagnosticsResponse = {
      status: healthResult.data.status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - KERNEL_START_TIME) / 1000),
      version: process.env.npm_package_version ?? "unknown",
      environment: process.env.NODE_ENV ?? "development",
      services: healthResult.data.services,
      memory: typeof process !== "undefined" && process.memoryUsage
        ? {
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
        }
        : undefined,
    };

    return kernelOk(diagnostics, { traceId: opts?.traceId });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to get diagnostics",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}
