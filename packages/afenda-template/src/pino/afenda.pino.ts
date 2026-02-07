/**
 * Afenda Logger — generic, verbose, robust.
 *
 * Goals:
 * - Structured logs (JSON-friendly)
 * - Minimal deps (no required external logger)
 * - Works in Node + browser/edge (console-based)
 * - Child logger with bound context
 *
 * This is NOT a constant-layer file (it may generate IDs, read env, etc.).
 */

import { LOG_LEVELS, type LogLevel, toLogLevel, LOG_CONTEXT_KEYS } from "../constant";

export type LogContext = Record<string, unknown>;

export type AfendaLogger = {
  level: LogLevel;
  name: string;

  child: (ctx: LogContext) => AfendaLogger;

  trace: (msg: string, ctx?: LogContext) => void;
  debug: (msg: string, ctx?: LogContext) => void;
  info: (msg: string, ctx?: LogContext) => void;
  warn: (msg: string, ctx?: LogContext) => void;
  error: (msg: string, ctx?: LogContext) => void;
  fatal: (msg: string, ctx?: LogContext) => void;
};

export type CreateLoggerOptions = {
  /** Component/service name (e.g. "afenda.server", "afenda.api") */
  name: string;
  /** Min level to emit (default: INFO) */
  level?: LogLevel | string;
  /** Base/bound context applied to every log line */
  base?: LogContext;
  /** Custom sink (default: console) */
  sink?: (line: string, level: LogLevel) => void;
  /** Provide an injected trace id getter (recommended for request-scoped logs) */
  getTraceId?: () => string | undefined;
};

/** Numeric order for filtering */
const LEVEL_ORDER: Record<LogLevel, number> = {
  [LOG_LEVELS.TRACE]: 10,
  [LOG_LEVELS.DEBUG]: 20,
  [LOG_LEVELS.INFO]: 30,
  [LOG_LEVELS.WARN]: 40,
  [LOG_LEVELS.ERROR]: 50,
  [LOG_LEVELS.FATAL]: 60,
};

function defaultSink(line: string, level: LogLevel) {
  // Map to console methods (still JSON structured)
  if (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.FATAL) console.error(line);
  else if (level === LOG_LEVELS.WARN) console.warn(line);
  else console.log(line);
}

function safeNowIso(): string {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function mergeContext(a?: LogContext, b?: LogContext): LogContext | undefined {
  if (!a && !b) return undefined;
  return { ...(a ?? {}), ...(b ?? {}) };
}

export function createLogger(options: CreateLoggerOptions): AfendaLogger {
  const level = toLogLevel(options.level, LOG_LEVELS.INFO);
  const name = options.name || "afenda";
  const sink = options.sink ?? defaultSink;

  const base = options.base ?? {};
  const getTraceId = options.getTraceId;

  function emit(lvl: LogLevel, msg: string, ctx?: LogContext) {
    if (LEVEL_ORDER[lvl] < LEVEL_ORDER[level]) return;

    const traceId = getTraceId?.();
    const merged = mergeContext(base, ctx);

    const payload: Record<string, unknown> = {
      ts: safeNowIso(),
      level: lvl,
      name,
      msg,
      ...(merged ?? {}),
    };

    // Attach traceId under canonical key if not already present
    if (traceId && payload[LOG_CONTEXT_KEYS.TRACE_ID] == null) {
      payload[LOG_CONTEXT_KEYS.TRACE_ID] = traceId;
    }

    // Ensure it's always serializable
    let line: string;
    try {
      line = JSON.stringify(payload);
    } catch {
      // fallback: avoid throwing from logger
      line = JSON.stringify({
        ts: payload.ts,
        level: payload.level,
        name: payload.name,
        msg: payload.msg,
        _nonserializable_ctx: true,
      });
    }

    sink(line, lvl);
  }

  const api: AfendaLogger = {
    level,
    name,

    child: (ctx) => createLogger({ ...options, level, name, base: mergeContext(base, ctx) ?? {} }),

    trace: (msg, ctx) => emit(LOG_LEVELS.TRACE, msg, ctx),
    debug: (msg, ctx) => emit(LOG_LEVELS.DEBUG, msg, ctx),
    info: (msg, ctx) => emit(LOG_LEVELS.INFO, msg, ctx),
    warn: (msg, ctx) => emit(LOG_LEVELS.WARN, msg, ctx),
    error: (msg, ctx) => emit(LOG_LEVELS.ERROR, msg, ctx),
    fatal: (msg, ctx) => emit(LOG_LEVELS.FATAL, msg, ctx),
  };

  return api;
}
