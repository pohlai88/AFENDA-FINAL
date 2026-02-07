/**
 * Request context store (optional).
 *
 * In Node, uses AsyncLocalStorage to carry request-scoped context:
 * - traceId, requestId, userId, tenantId, sessionId, etc.
 *
 * In Edge/Browser, falls back to a simple in-memory context.
 */

import { LOG_CONTEXT_KEYS } from "../constant";

// Node-only import guarded
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AsyncLocalStorageCtor: any = undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AsyncLocalStorageCtor = require("node:async_hooks").AsyncLocalStorage;
} catch {
  AsyncLocalStorageCtor = undefined;
}

export type AfendaRequestContext = Partial<Record<(typeof LOG_CONTEXT_KEYS)[keyof typeof LOG_CONTEXT_KEYS], string>> &
  Record<string, unknown>;

const fallbackContext: AfendaRequestContext = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const als: any = AsyncLocalStorageCtor ? new AsyncLocalStorageCtor() : null;

export function runWithRequestContext<T>(ctx: AfendaRequestContext, fn: () => T): T {
  if (als) return als.run(ctx, fn);
  Object.assign(fallbackContext, ctx);
  return fn();
}

export function getRequestContext(): AfendaRequestContext {
  if (als) return als.getStore() ?? {};
  return fallbackContext;
}

export function getTraceIdFromContext(): string | undefined {
  const ctx = getRequestContext();
  const v = ctx[LOG_CONTEXT_KEYS.TRACE_ID];
  return typeof v === "string" && v.length ? v : undefined;
}
