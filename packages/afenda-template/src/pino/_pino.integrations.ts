/**
 * Framework integration helpers for Pino logger.
 * Provides patterns for Next.js, Express, and other frameworks.
 */

import type { AfendaLogger, CreateLoggerOptions } from "./afenda.pino";
import type { LogContext } from "./afenda.pino";

/**
 * Next.js integration for Pino.
 */
export const NextJsIntegration = {
  /**
   * Middleware for Next.js App Router to bind context.
   */
  createContextMiddleware: (logger: AfendaLogger) => {
    return (ctx: LogContext) => {
      if (typeof window === "undefined") {
        // Server-side: would integrate with AsyncLocalStorage
        return logger.child(ctx);
      }
      return logger; // Client-side: no context binding
    };
  },

  /**
   * API route handler wrapper for automatic logging.
   */
  wrapApiRoute: (logger: AfendaLogger) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (handler: (req: any, res: any) => Promise<void> | void) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (req: any, res: any) => {
        const startTime = Date.now();
        try {
          await handler(req, res);
          const duration = Date.now() - startTime;
          logger.info(`${req.method} ${req.url}`, { duration, status: res.statusCode });
        } catch (err) {
          const duration = Date.now() - startTime;
          logger.error(`${req.method} ${req.url} failed`, {
            duration,
            error: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      };
    };
  },
};

/**
 * Express integration for Pino.
 */
export const ExpressIntegration = {
  /**
   * Express middleware for automatic request logging.
   */
  createMiddleware: (logger: AfendaLogger) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (req: any, res: any, _next: any) => {
      const startTime = Date.now();

      // Bind logger to request
      req.log = logger.child({
        requestId: req.id || req.headers["x-request-id"],
        method: req.method,
        url: req.path,
        ip: req.ip,
      });

      // Wrap response end
      const originalEnd = res.end;
      res.end = function (...args: unknown[]) {
        const duration = Date.now() - startTime;
        req.log.info(`${req.method} ${req.path}`, {
          status: res.statusCode,
          duration,
        });
        return originalEnd.apply(res, args);
      };

      _next();
    };
  },

  /**
   * Error handling middleware for Express.
   */
  createErrorMiddleware: (_logger: AfendaLogger) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (err: any, req: any, res: any, _next: any) => {
      req.log?.error("Request error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        status: err.statusCode || 500,
      });

      res.status(err.statusCode || 500).json({
        error: err.message || "Internal Server Error",
      });
    };
  },
};

/**
 * Generic server integration.
 */
export const ServerIntegration = {
  /**
   * Create a request-scoped logger factory.
   */
  createRequestLoggerFactory: (baseLogger: AfendaLogger) => {
    return (requestContext: LogContext) => {
      return baseLogger.child(requestContext);
    };
  },

  /**
   * Wrap an async handler with automatic logging.
   */
  wrapAsyncHandler: <T>(logger: AfendaLogger, handler: () => Promise<T>, label: string) => {
    return async () => {
      const startTime = Date.now();
      try {
        const result = await handler();
        const duration = Date.now() - startTime;
        logger.debug(`${label} completed`, { duration });
        return result;
      } catch (err) {
        const duration = Date.now() - startTime;
        logger.error(`${label} failed`, {
          duration,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    };
  },

  /**
   * Create a health check logger.
   */
  createHealthCheckLogger: (logger: AfendaLogger) => {
    return {
      logHealth: (status: "healthy" | "unhealthy", details?: LogContext) => {
        const method = status === "healthy" ? "info" : "warn";
        logger[method](`Health check: ${status}`, details);
      },
    };
  },
};

/**
 * Client-side integration (browser/edge).
 */
export const ClientIntegration = {
  /**
   * Create a client-side logger with network transmission.
   */
  createRemoteLogger: (baseLogger: AfendaLogger, remoteUrl: string) => {
    const buffer: Array<{ msg: string; level: string; ctx?: LogContext }> = [];

    const sendLogs = () => {
      if (buffer.length === 0) return;
      const toSend = [...buffer];
      buffer.length = 0;

      // Use beacon for best-effort delivery
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(remoteUrl, JSON.stringify(toSend));
      } else if (typeof fetch !== "undefined") {
        fetch(remoteUrl, {
          method: "POST",
          body: JSON.stringify(toSend),
          keepalive: true,
        }).catch(() => {
          // Silently fail
        });
      }
    };

    // Send logs periodically
    if (typeof setInterval !== "undefined") {
      setInterval(sendLogs, 30000);
    }

    // Send on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", sendLogs);
    }

    return {
      ...baseLogger,
      trace: (msg: string, ctx?: LogContext) => {
        baseLogger.trace(msg, ctx);
        buffer.push({ msg, level: "trace", ctx });
      },
      debug: (msg: string, ctx?: LogContext) => {
        baseLogger.debug(msg, ctx);
        buffer.push({ msg, level: "debug", ctx });
      },
      info: (msg: string, ctx?: LogContext) => {
        baseLogger.info(msg, ctx);
        buffer.push({ msg, level: "info", ctx });
      },
      warn: (msg: string, ctx?: LogContext) => {
        baseLogger.warn(msg, ctx);
        buffer.push({ msg, level: "warn", ctx });
      },
      error: (msg: string, ctx?: LogContext) => {
        baseLogger.error(msg, ctx);
        buffer.push({ msg, level: "error", ctx });
      },
      fatal: (msg: string, ctx?: LogContext) => {
        baseLogger.fatal(msg, ctx);
        buffer.push({ msg, level: "fatal", ctx });
      },
      flush: sendLogs,
    };
  },
};

/**
 * Create environment-aware logger configuration.
 */
export function createEnvironmentAwareConfig(env?: string): Partial<CreateLoggerOptions> {
  const environment = env || (typeof process !== "undefined" ? process.env.NODE_ENV : "browser");

  if (environment === "production") {
    return {
      level: "info",
    };
  }

  if (environment === "test") {
    return {
      level: "error", // Suppress logs during tests
    };
  }

  // Development
  return {
    level: "debug",
  };
}
