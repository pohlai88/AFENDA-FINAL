/**
 * Logging levels and standard context keys.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Levels
 * --------------------------------------------- */
export const LOG_LEVELS = {
  TRACE: "trace",
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal",
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

const LogLevelEnum = makeStringEnum(LOG_LEVELS);

export const LOG_LEVEL_LIST = LogLevelEnum.list as readonly LogLevel[];
export const isLogLevel = LogLevelEnum.is;

export function toLogLevel(value: unknown, fallback: LogLevel = LOG_LEVELS.INFO): LogLevel {
  return LogLevelEnum.to(value, fallback) as LogLevel;
}

/** ---------------------------------------------
 * Context keys
 * --------------------------------------------- */
export const LOG_CONTEXT_KEYS = {
  REQUEST_ID: "requestId",
  TRACE_ID: "traceId",
  USER_ID: "userId",
  TENANT_ID: "tenantId",
  SESSION_ID: "sessionId",
} as const;

export type LogContextKey = (typeof LOG_CONTEXT_KEYS)[keyof typeof LOG_CONTEXT_KEYS];

const LogContextKeyEnum = makeStringEnum(LOG_CONTEXT_KEYS);

export const LOG_CONTEXT_KEY_LIST = LogContextKeyEnum.list as readonly LogContextKey[];
export const isLogContextKey = LogContextKeyEnum.is;

export function toLogContextKey(
  value: unknown,
  fallback: LogContextKey = LOG_CONTEXT_KEYS.TRACE_ID
): LogContextKey {
  return LogContextKeyEnum.to(value, fallback) as LogContextKey;
}
