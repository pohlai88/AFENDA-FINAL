/**
 * Orchestra Kernel Logger
 * Structured logging for server-side kernel code.
 * Use this instead of console.* per 01-AGENT.
 *
 * TODO: Replace with pino/shared logger when available.
 */

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(prefix: string, message: string, context?: LogContext): string {
  const ctxStr = context && Object.keys(context).length > 0
    ? ` ${JSON.stringify(context)}`
    : "";
  return `[${prefix}] ${message}${ctxStr}`;
}

export const kernelLogger = {
  error(prefix: string, message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "test") {
      console.error(formatMessage(prefix, message, context));
    }
  },
  warn(prefix: string, message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "test") {
      console.warn(formatMessage(prefix, message, context));
    }
  },
  info(prefix: string, message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "test") {
      console.info(formatMessage(prefix, message, context));
    }
  },
  debug(prefix: string, message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatMessage(prefix, message, context));
    }
  },
} as const;
