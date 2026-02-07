/**
 * Enhanced type definitions for Pino logger.
 * Provides strict type safety, utility types, and guard functions.
 */

import type { AfendaLogger, LogContext, CreateLoggerOptions } from "./afenda.pino";
import type { LogLevel } from "../constant";

/**
 * Extract the log context type safely.
 */
export type LogContextData = LogContext;

/**
 * Logger with extended methods for common patterns.
 */
export interface ExtendedLogger extends AfendaLogger {
  isLevelEnabled: (level: LogLevel) => boolean;
  withContext: (ctx: LogContextData) => ExtendedLogger;
  captureException: (error: Error, ctx?: LogContextData) => void;
  measureTime: (label: string, fn: () => Promise<void>) => Promise<void>;
}

/**
 * Configuration for creating a logger instance.
 */
export type LoggerConfig = CreateLoggerOptions & {
  /** Enable automatic error capture */
  captureErrors?: boolean;
  /** Enable performance metrics */
  enableMetrics?: boolean;
  /** Custom serializers for objects */
  serializers?: Record<string, (obj: unknown) => unknown>;
  /** Context filters (redact sensitive data) */
  filters?: Array<(ctx: LogContextData) => LogContextData>;
};

/**
 * Structured log entry (as emitted).
 */
export type LogEntry = {
  ts: string;
  level: LogLevel;
  name: string;
  msg: string;
  [key: string]: unknown;
};

/**
 * Type guard: is context object a LogContext?
 */
export function isLogContext(value: unknown): value is LogContextData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard: is string a valid log level?
 */
export function isLogLevel(value: unknown): value is LogLevel {
  const logLevels = ["trace", "debug", "info", "warn", "error", "fatal"];
  return typeof value === "string" && logLevels.includes(value);
}

/**
 * Create a type-safe log context builder.
 */
export function createLogContextBuilder() {
  return {
    build: (): LogContextData => ({}),
    with: (key: string, value: unknown) => ({
      build: (): LogContextData => ({ [key]: value }),
      with: (_nextKey: string, _nextValue: unknown) => createLogContextBuilder(),
    }),
  };
}

/**
 * Extract keys from a log context safely.
 */
export function getLogContextKeys(ctx: LogContextData): string[] {
  return Object.keys(ctx).filter((key) => typeof key === "string");
}

/**
 * Merge multiple log contexts with proper typing.
 */
export function mergeLogContexts(...contexts: (LogContextData | undefined)[]): LogContextData {
  return contexts.reduce<LogContextData>(
    (acc, ctx) => {
      if (ctx && isLogContext(ctx)) {
        return { ...acc, ...ctx };
      }
      return acc;
    },
    {} as LogContextData
  );
}

/**
 * Create a log context filter function.
 */
export function createLogContextFilter(keys: string[]): (ctx: LogContextData) => LogContextData {
  return (ctx) => {
    const filtered: LogContextData = {};
    for (const key of keys) {
      if (key in ctx) {
        filtered[key] = ctx[key];
      }
    }
    return filtered;
  };
}

/**
 * Create a redaction filter for sensitive data.
 */
export function createRedactionFilter(sensitiveKeys: string[]): (ctx: LogContextData) => LogContextData {
  return (ctx) => {
    const result = { ...ctx };
    for (const key of sensitiveKeys) {
      if (key in result) {
        result[key] = "[REDACTED]";
      }
    }
    return result;
  };
}

/**
 * Logger factory type.
 */
export type LoggerFactory = {
  create: (name: string, opts?: Partial<LoggerConfig>) => ExtendedLogger;
  child: (ctx: LogContextData) => ExtendedLogger;
  level: LogLevel;
  name: string;
};

/**
 * Safe error serializer.
 */
export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  if (typeof err === "object" && err !== null) {
    return { error: String(err) };
  }
  return { error: String(err) };
}

/**
 * Safe request serializer (for HTTP requests).
 */
export function serializeRequest(req: unknown): Record<string, unknown> {
  if (typeof req !== "object" || req === null) {
    return { request: String(req) };
  }

  const obj = req as Record<string, unknown>;
  return {
    method: obj.method,
    url: obj.url,
    headers: typeof obj.headers === "object" ? "[headers]" : undefined,
    query: obj.query,
  };
}

/**
 * Safe response serializer (for HTTP responses).
 */
export function serializeResponse(res: unknown): Record<string, unknown> {
  if (typeof res !== "object" || res === null) {
    return { response: String(res) };
  }

  const obj = res as Record<string, unknown>;
  return {
    statusCode: obj.statusCode,
    statusMessage: obj.statusMessage,
    headers: typeof obj.headers === "object" ? "[headers]" : undefined,
  };
}
