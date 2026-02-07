/**
 * Orchestra Kernel Health Schema
 * Aggregate health status across registered services.
 *
 * Zero domain knowledge — just pings endpoints, no awareness of what they do.
 */

import { z } from "zod";

/** System-level health status */
export const SYSTEM_HEALTH_STATUS = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  DOWN: "down",
} as const;

export type SystemHealthStatus = (typeof SYSTEM_HEALTH_STATUS)[keyof typeof SYSTEM_HEALTH_STATUS];

const SYSTEM_HEALTH_STATUS_VALUES = Object.values(SYSTEM_HEALTH_STATUS) as [SystemHealthStatus, ...SystemHealthStatus[]];

/** Individual service health check result */
export const ServiceHealthResultSchema = z.object({
  serviceId: z.string(),
  status: z.enum(SYSTEM_HEALTH_STATUS_VALUES),
  latencyMs: z.number().int().nonnegative().nullable(),
  lastCheck: z.string().datetime(),
  error: z.string().nullable(),
});

export type ServiceHealthResult = z.infer<typeof ServiceHealthResultSchema>;

/** Full system health response */
export const SystemHealthResponseSchema = z.object({
  status: z.enum(SYSTEM_HEALTH_STATUS_VALUES),
  timestamp: z.string().datetime(),
  uptime: z.number().int().nonnegative(),
  services: z.array(ServiceHealthResultSchema),
  summary: z.object({
    total: z.number().int().nonnegative(),
    healthy: z.number().int().nonnegative(),
    degraded: z.number().int().nonnegative(),
    down: z.number().int().nonnegative(),
  }),
});

export type SystemHealthResponse = z.infer<typeof SystemHealthResponseSchema>;

/** Lightweight health check response (v1 endpoint) */
export const HealthCheckResponseSchema = z.object({
  status: z.enum(SYSTEM_HEALTH_STATUS_VALUES),
  timestamp: z.string().datetime(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

/** Detailed diagnostics response (ops endpoint) */
export const DiagnosticsResponseSchema = z.object({
  status: z.enum(SYSTEM_HEALTH_STATUS_VALUES),
  timestamp: z.string().datetime(),
  uptime: z.number().int().nonnegative(),
  version: z.string(),
  environment: z.string(),
  services: z.array(ServiceHealthResultSchema),
  memory: z.object({
    heapUsed: z.number().int().nonnegative(),
    heapTotal: z.number().int().nonnegative(),
    external: z.number().int().nonnegative(),
  }).optional(),
});

export type DiagnosticsResponse = z.infer<typeof DiagnosticsResponseSchema>;
