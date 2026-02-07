/**
 * Orchestra Kernel System Constants
 * Error codes, health states, audit event types.
 *
 * Zero domain knowledge — pure system infrastructure.
 */

/** Re-export error codes from envelope schema */
export { KERNEL_ERROR_CODES, type KernelErrorCode } from "../zod/orchestra.envelope.schema";

/** Re-export service status from service schema */
export { SERVICE_STATUS, type ServiceStatus } from "../zod/orchestra.service.schema";

/** Re-export health status from health schema */
export { SYSTEM_HEALTH_STATUS, type SystemHealthStatus } from "../zod/orchestra.health.schema";

/** Re-export audit event types from drizzle schema */
export { AUDIT_EVENT_TYPES, type AuditEventType } from "../drizzle/orchestra.schema";

/** Re-export config namespaces from admin-config schema */
export { CONFIG_NAMESPACES, type ConfigNamespace } from "../zod/orchestra.admin-config.schema";

/**
 * HTTP status codes used by kernel APIs.
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * Header names used by kernel APIs.
 */
export const KERNEL_HEADERS = {
  REQUEST_ID: "x-request-id",
  TRACE_ID: "x-trace-id",
  ACTOR_ID: "x-actor-id",
  CONTENT_TYPE: "content-type",
} as const;

export type KernelHeader = (typeof KERNEL_HEADERS)[keyof typeof KERNEL_HEADERS];

/**
 * API tier identifiers.
 */
export const API_TIERS = {
  BFF: "bff",
  OPS: "ops",
  V1: "v1",
} as const;

export type ApiTier = (typeof API_TIERS)[keyof typeof API_TIERS];

/**
 * Entity types for audit logging.
 */
export const ENTITY_TYPES = {
  SERVICE: "service",
  CONFIG: "config",
  BACKUP: "backup",
  RESTORE: "restore",
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

/**
 * Default timeout values (in milliseconds).
 */
export const TIMEOUTS = {
  HEALTH_CHECK: 5000,
  BACKUP: 30000,
  RESTORE: 60000,
  SERVICE_CALL: 10000,
} as const;

/**
 * Pagination defaults.
 */
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000,
  DEFAULT_OFFSET: 0,
} as const;
