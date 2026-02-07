import { createLogger, createTraceId, runWithRequestContext, getTraceIdFromContext } from "../pino";
import { apiOk } from "./afenda.envelope";
import { LOG_CONTEXT_KEYS } from "../constant";

export const afendaServiceVersion = "0.1.0";

export class AfendaService {
  private readonly log = createLogger({
    name: "afenda.service",
    // You can wire env-based level here later; keep stable default for now.
    level: "info",
    getTraceId: getTraceIdFromContext,
  });

  async initialize() {
    const traceId = createTraceId("svc");
    return runWithRequestContext({ [LOG_CONTEXT_KEYS.TRACE_ID]: traceId }, async () => {
      this.log.info("Service initialize() start");

      // ... real init steps go here ...

      this.log.info("Service initialize() success");
      const readyAt = new Date().toISOString();
      return apiOk(
        {
          status: "initialized",
          version: afendaServiceVersion,
          readyAt,
        },
        { traceId }
      );
    });
  }
}

export const afendaService = new AfendaService();
