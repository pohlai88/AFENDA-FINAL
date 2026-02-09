/**
 * Orchestra Kernel Logger (Pino)
 * Structured logging for server-side kernel code.
 * Use instead of console.* per 01-AGENT.
 *
 * @domain orchestra
 * @layer pino
 */

import pino from "pino";

export const kernelLogger = pino({
  name: "orchestra",
  level: process.env.LOG_LEVEL ?? "info",
});

/**
 * Create a scoped child logger for a specific kernel context.
 * @example
 * const logger = createKernelLogger("backup");
 * logger.info({ backupId }, "Backup started");
 */
export function createKernelLogger(context: string) {
  return kernelLogger.child({ context });
}

/** Log errors for server-side handlers. Use instead of console.error. */
export function logKernelError(error: unknown, context: Record<string, unknown>) {
  kernelLogger.error({ err: error, ...context }, "kernel error");
}
