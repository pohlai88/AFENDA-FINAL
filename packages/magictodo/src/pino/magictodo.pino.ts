/**
 * magictodo domain logger (pino configuration).
 */

import pino from "pino";

export const magictodoLogger = pino({
  name: "magictodo",
  level: process.env.LOG_LEVEL ?? "info",
});

export function createLogger(context: string) {
  return magictodoLogger.child({ context });
}

/** Log errors for server-side handlers. Use instead of console.error. */
export const logError = (error: unknown, context: Record<string, unknown>) => {
  magictodoLogger.error({ err: error, ...context }, "magictodo error");
};
