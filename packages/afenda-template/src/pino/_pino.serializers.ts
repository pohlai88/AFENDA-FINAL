/**
 * Custom serializers for Pino logger.
 * Handles safe serialization of objects, errors, requests, responses.
 */

import type { LogContext } from "./afenda.pino";

/**
 * Serializer function type.
 */
export type Serializer<T = unknown> = (obj: T) => unknown;

/**
 * Safely serialize any value.
 */
export function safeSerialize(value: unknown, depth: number = 5): unknown {
  if (depth <= 0) {
    return "[MAX_DEPTH_EXCEEDED]";
  }

  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((v) => safeSerialize(v, depth - 1));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result[key] = safeSerialize((value as any)[key], depth - 1);
      }
    }
    return result;
  }

  if (typeof value === "function") {
    return "[Function]";
  }

  if (typeof value === "symbol") {
    return `[Symbol(${String(value)})]`;
  }

  return "[Unserializable]";
}

/**
 * Serialize Error objects with stack trace.
 */
export function serializeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) {
    return {
      error: String(err),
      type: typeof err,
    };
  }

  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
    cause: "cause" in err ? safeSerialize((err as { cause?: unknown }).cause) : undefined,
  };
}

/**
 * Serialize HTTP request objects.
 */
export function serializeHttpRequest(req: unknown): Record<string, unknown> {
  if (typeof req !== "object" || req === null) {
    return { request: String(req) };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = req as any;

  return {
    method: obj.method,
    url: obj.url,
    pathname: obj.pathname,
    query: obj.query,
    headers: serializeHeaders(obj.headers),
    ip: obj.ip,
    hostname: obj.hostname,
  };
}

/**
 * Serialize HTTP response objects.
 */
export function serializeHttpResponse(res: unknown): Record<string, unknown> {
  if (typeof res !== "object" || res === null) {
    return { response: String(res) };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = res as any;

  return {
    statusCode: obj.statusCode,
    statusMessage: obj.statusMessage,
    headers: serializeHeaders(obj.headers),
    contentLength: obj.contentLength,
  };
}

/**
 * Serialize HTTP headers (redact sensitive ones).
 */
export function serializeHeaders(headers: unknown): Record<string, unknown> {
  if (typeof headers !== "object" || headers === null) {
    return {};
  }

  const sensitiveHeaders = ["authorization", "cookie", "x-api-key", "x-auth-token"];
  const result: Record<string, unknown> = {};

  for (const key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        result[key] = "[REDACTED]";
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result[key] = (headers as any)[key];
      }
    }
  }

  return result;
}

/**
 * Create a custom serializer function.
 */
export function createSerializer<T>(predicate: (obj: unknown) => obj is T, serializer: Serializer<T>): Serializer {
  return (obj: unknown) => {
    if (predicate(obj)) {
      return serializer(obj);
    }
    return safeSerialize(obj);
  };
}

/**
 * Redact sensitive fields from context.
 */
export function redactContextFields(
  ctx: LogContext,
  fieldsToRedact: string[] = []
): LogContext {
  const defaultSensitiveFields = [
    "password",
    "token",
    "apiKey",
    "api_key",
    "secret",
    "authorization",
    "cookie",
    "sessionId",
    "session_id",
  ];

  const allSensitive = [...defaultSensitiveFields, ...fieldsToRedact];
  const result: LogContext = {};

  for (const key in ctx) {
    if (Object.prototype.hasOwnProperty.call(ctx, key)) {
      const lowerKey = key.toLowerCase();
      if (allSensitive.some((s) => lowerKey.includes(s.toLowerCase()))) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = ctx[key];
      }
    }
  }

  return result;
}

/**
 * Batch serializers by type.
 */
export function createSerializerMap(): Map<string, Serializer> {
  const map = new Map<string, Serializer>();

  map.set("Error", serializeError);
  map.set("Request", serializeHttpRequest);
  map.set("Response", serializeHttpResponse);

  return map;
}

/**
 * Serialize context with proper handling of special types.
 */
export function serializeContext(ctx: LogContext, serializers?: Map<string, Serializer>): LogContext {
  const result: LogContext = {};

  for (const key in ctx) {
    if (Object.prototype.hasOwnProperty.call(ctx, key)) {
      const value = ctx[key];
      const serializer = serializers?.get(key);

      if (serializer) {
        result[key] = serializer(value);
      } else {
        result[key] = safeSerialize(value);
      }
    }
  }

  return result;
}
