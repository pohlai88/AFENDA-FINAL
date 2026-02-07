/**
 * Testing utilities for Pino logger.
 * Provides mock loggers, spies, and test helpers.
 */

import type { AfendaLogger, LogContext, CreateLoggerOptions } from "./afenda.pino";
import type { LogLevel } from "../constant";

/**
 * Mock logger for testing.
 */
export interface MockLogger extends AfendaLogger {
  getLogs: () => Array<{ level: LogLevel; msg: string; ctx?: LogContext }>;
  getLogsByLevel: (level: LogLevel) => Array<{ msg: string; ctx?: LogContext }>;
  clear: () => void;
  hasLog: (level: LogLevel, msgPattern: string | RegExp) => boolean;
  getFirstLog: () => { level: LogLevel; msg: string; ctx?: LogContext } | null;
  getLastLog: () => { level: LogLevel; msg: string; ctx?: LogContext } | null;
}

/**
 * Create a mock logger for testing.
 */
export function createMockLogger(opts?: Partial<CreateLoggerOptions>): MockLogger {
  const logs: Array<{ level: LogLevel; msg: string; ctx?: LogContext }> = [];

  const logAll = (level: LogLevel, msg: string, ctx?: LogContext) => {
    logs.push({ level, msg, ctx });
  };

  return {
    name: opts?.name ?? "test-logger",
    level: (opts?.level as LogLevel) ?? "info",

    child: (ctx) => createMockLogger({ ...opts, base: ctx }),

    trace: (msg, ctx) => logAll("trace", msg, ctx),
    debug: (msg, ctx) => logAll("debug", msg, ctx),
    info: (msg, ctx) => logAll("info", msg, ctx),
    warn: (msg, ctx) => logAll("warn", msg, ctx),
    error: (msg, ctx) => logAll("error", msg, ctx),
    fatal: (msg, ctx) => logAll("fatal", msg, ctx),

    getLogs: () => [...logs],
    getLogsByLevel: (level) => logs.filter((l) => l.level === level),
    clear: () => {
      logs.length = 0;
    },
    hasLog: (level, msgPattern) => {
      const pattern = typeof msgPattern === "string" ? new RegExp(msgPattern) : msgPattern;
      return logs.some((l) => l.level === level && pattern.test(l.msg));
    },
    getFirstLog: () => logs[0] ?? null,
    getLastLog: () => logs[logs.length - 1] ?? null,
  };
}

/**
 * Logger spy for tracking method calls.
 */
export interface LoggerSpy {
  calls: Map<LogLevel, Array<{ msg: string; ctx?: LogContext }>>;
  callCount: (level?: LogLevel) => number;
  wasCalledWith: (level: LogLevel, msgPattern: string | RegExp) => boolean;
  restore: () => void;
}

/**
 * Spy on logger method calls.
 */
export function spyOnLogger(logger: AfendaLogger): LoggerSpy {
  const originalMethods = {
    trace: logger.trace,
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    fatal: logger.fatal,
  };

  const calls: Map<LogLevel, Array<{ msg: string; ctx?: LogContext }>> = new Map();
  const levels: LogLevel[] = ["trace", "debug", "info", "warn", "error", "fatal"];

  for (const level of levels) {
    calls.set(level, []);
  }

  const createWrapper =
    (level: LogLevel, original: (msg: string, ctx?: LogContext) => void) =>
    (msg: string, ctx?: LogContext) => {
      const levelCalls = calls.get(level);
      if (levelCalls) {
        levelCalls.push({ msg, ctx });
      }
      original(msg, ctx);
    };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logger as any).trace = createWrapper("trace", originalMethods.trace);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logger as any).debug = createWrapper("debug", originalMethods.debug);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logger as any).info = createWrapper("info", originalMethods.info);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logger as any).warn = createWrapper("warn", originalMethods.warn);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logger as any).error = createWrapper("error", originalMethods.error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logger as any).fatal = createWrapper("fatal", originalMethods.fatal);

  return {
    calls,

    callCount: (level?: LogLevel) => {
      if (level) {
        return calls.get(level)?.length ?? 0;
      }
      let total = 0;
      for (const levelCalls of calls.values()) {
        total += levelCalls.length;
      }
      return total;
    },

    wasCalledWith: (level, msgPattern) => {
      const pattern = typeof msgPattern === "string" ? new RegExp(msgPattern) : msgPattern;
      const levelCalls = calls.get(level);
      return levelCalls ? levelCalls.some((call) => pattern.test(call.msg)) : false;
    },

    restore: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (logger as any).trace = originalMethods.trace;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (logger as any).debug = originalMethods.debug;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (logger as any).info = originalMethods.info;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (logger as any).warn = originalMethods.warn;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (logger as any).error = originalMethods.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (logger as any).fatal = originalMethods.fatal;
    },
  };
}

/**
 * Assert logger was called with specific message.
 */
export function assertLoggerCalled(
  spy: LoggerSpy,
  level: LogLevel,
  msgPattern: string | RegExp
): void {
  if (!spy.wasCalledWith(level, msgPattern)) {
    const pattern = typeof msgPattern === "string" ? msgPattern : msgPattern.source;
    throw new Error(`Logger not called at level '${level}' with message matching '${pattern}'`);
  }
}

/**
 * Assert logger was not called.
 */
export function assertLoggerNotCalled(spy: LoggerSpy, level?: LogLevel): void {
  const count = spy.callCount(level);
  if (count > 0) {
    throw new Error(`Logger was called ${count} times (expected 0)`);
  }
}

/**
 * Create a log collector for async operations.
 */
export function createLogCollector(): {
  collect: (logger: AfendaLogger) => AfendaLogger;
  getLogs: () => Array<{ level: LogLevel; msg: string; ctx?: LogContext }>;
  flush: () => void;
} {
  const logs: Array<{ level: LogLevel; msg: string; ctx?: LogContext }> = [];

  return {
    collect: (logger: AfendaLogger): AfendaLogger => {
      return {
        ...logger,
        trace: (msg, ctx) => {
          logs.push({ level: "trace", msg, ctx });
          logger.trace(msg, ctx);
        },
        debug: (msg, ctx) => {
          logs.push({ level: "debug", msg, ctx });
          logger.debug(msg, ctx);
        },
        info: (msg, ctx) => {
          logs.push({ level: "info", msg, ctx });
          logger.info(msg, ctx);
        },
        warn: (msg, ctx) => {
          logs.push({ level: "warn", msg, ctx });
          logger.warn(msg, ctx);
        },
        error: (msg, ctx) => {
          logs.push({ level: "error", msg, ctx });
          logger.error(msg, ctx);
        },
        fatal: (msg, ctx) => {
          logs.push({ level: "fatal", msg, ctx });
          logger.fatal(msg, ctx);
        },
      };
    },

    getLogs: () => [...logs],

    flush: () => {
      logs.length = 0;
    },
  };
}

/**
 * Suppress console output during tests.
 */
export function withSuppressedConsole<T>(fn: () => T): T {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};

  try {
    return fn();
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}
