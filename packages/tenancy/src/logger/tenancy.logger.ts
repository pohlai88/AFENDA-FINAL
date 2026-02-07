/**
 * @domain tenancy
 * @layer logger
 * @responsibility Domain-specific Pino logger (no console.* per 01-AGENT)
 */

import pino from "pino";

export const tenancyLogger = pino({
  name: "tenancy",
  level: process.env.LOG_LEVEL ?? "info",
});

export function createLogger(context: string) {
  return tenancyLogger.child({ context });
}
