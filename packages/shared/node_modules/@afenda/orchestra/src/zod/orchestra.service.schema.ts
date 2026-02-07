/**
 * Orchestra Kernel Service Registry Schema
 * Minimal service definition — endpoint + health check only.
 *
 * Zero domain knowledge — kernel knows nothing about what services do.
 */

import { z } from "zod";

/** Service status values */
export const SERVICE_STATUS = {
  REGISTERED: "registered",
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  UNHEALTHY: "unhealthy",
  UNREGISTERED: "unregistered",
} as const;

export type ServiceStatus = (typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS];

const SERVICE_STATUS_VALUES = Object.values(SERVICE_STATUS) as [ServiceStatus, ...ServiceStatus[]];

/** Input schema for registering a new service */
export const RegisterServiceInputSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/, "Service ID must be lowercase alphanumeric with hyphens"),
  endpoint: z.string().url("Endpoint must be a valid URL"),
  healthCheck: z.string().min(1, "Health check path is required"),
  description: z.string().max(256).optional(),
  version: z.string().max(32).optional(),
  tags: z.array(z.string().max(64)).max(10).optional(),
  ownerContact: z.string().max(128).optional(),
  documentationUrl: z.string().url().optional().or(z.literal("")),
  healthCheckIntervalMs: z.number().int().min(5000).max(300000).optional(),
  healthCheckTimeoutMs: z.number().int().min(1000).max(60000).optional(),
});

export type RegisterServiceInput = z.infer<typeof RegisterServiceInputSchema>;

/** Input schema for updating service metadata */
export const UpdateServiceMetadataSchema = z.object({
  description: z.string().max(256).optional(),
  version: z.string().max(32).optional(),
  tags: z.array(z.string().max(64)).max(10).optional(),
  ownerContact: z.string().max(128).optional(),
  documentationUrl: z.string().url().optional().or(z.literal("")),
  healthCheckIntervalMs: z.number().int().min(5000).max(300000).optional(),
  healthCheckTimeoutMs: z.number().int().min(1000).max(60000).optional(),
});

export type UpdateServiceMetadata = z.infer<typeof UpdateServiceMetadataSchema>;

/** Full service record (stored in DB) */
export const ServiceRecordSchema = z.object({
  id: z.string(),
  endpoint: z.string().url(),
  healthCheck: z.string(),
  description: z.string().nullable(),
  version: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  status: z.enum(SERVICE_STATUS_VALUES),
  lastHealthCheck: z.string().datetime().nullable(),
  ownerContact: z.string().nullable(),
  documentationUrl: z.string().nullable(),
  healthCheckIntervalMs: z.number().int().nullable(),
  healthCheckTimeoutMs: z.number().int().nullable(),
  registeredAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ServiceRecord = z.infer<typeof ServiceRecordSchema>;

/** Lightweight service info for listing */
export const ServiceListItemSchema = z.object({
  id: z.string(),
  endpoint: z.string().url(),
  status: z.enum(SERVICE_STATUS_VALUES),
  lastHealthCheck: z.string().datetime().nullable(),
});

export type ServiceListItem = z.infer<typeof ServiceListItemSchema>;

/** Service list response */
export const ServiceListResponseSchema = z.object({
  services: z.array(ServiceListItemSchema),
  total: z.number().int().nonnegative(),
});

export type ServiceListResponse = z.infer<typeof ServiceListResponseSchema>;
