/**
 * Client-side Logger Utility
 * Provides structured logging for client components with optional remote reporting.
 * 
 * @domain shared
 * @layer utils
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

class ClientLogger {
  private isDevelopment: boolean;
  private enableRemoteLogging: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.enableRemoteLogging = process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOGGING === "true";
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }

  private log(entry: LogEntry): void {
    // In development, use console for immediate feedback
    if (this.isDevelopment) {
      const prefix = `[${entry.level.toUpperCase()}]`;
      const contextStr = entry.context ? JSON.stringify(entry.context) : "";
      
      switch (entry.level) {
        case "error":
          console.error(prefix, entry.message, contextStr, entry.error);
          break;
        case "warn":
          console.warn(prefix, entry.message, contextStr);
          break;
        case "info":
          console.info(prefix, entry.message, contextStr);
          break;
        case "debug":
          console.debug(prefix, entry.message, contextStr);
          break;
      }
    }

    // In production, queue for remote logging if enabled
    if (!this.isDevelopment && this.enableRemoteLogging) {
      this.sendToRemote(entry);
    }
  }

  private sendToRemote(entry: LogEntry): void {
    // Queue for batch sending to avoid performance impact
    // This could send to a logging service like Sentry, LogRocket, etc.
    if (typeof window !== "undefined") {
      interface LogQueue {
        queue?: LogEntry[];
        timer?: NodeJS.Timeout;
      }
      
      const logWindow = window as typeof window & { __logQueue__?: LogQueue };
      
      if (!logWindow.__logQueue__) {
        logWindow.__logQueue__ = { queue: [], timer: undefined };
      }
      
      logWindow.__logQueue__.queue = logWindow.__logQueue__.queue || [];
      logWindow.__logQueue__.queue.push(entry);

      // Batch send every 5 seconds
      if (!logWindow.__logQueue__.timer) {
        logWindow.__logQueue__.timer = setInterval(() => {
          const batch = logWindow.__logQueue__?.queue || [];
          if (batch.length > 0) {
            // Send batch to remote logging endpoint
            // eslint-disable-next-line no-restricted-syntax -- Shared package cannot import routes to avoid circular deps
            void fetch("/api/orchestra/audit/ops", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ logs: batch }),
            }).catch(() => {
              // Silently fail - don't want logging to break the app
            });
            if (logWindow.__logQueue__) {
              logWindow.__logQueue__.queue = [];
            }
          }
        }, 5000);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(this.createEntry("debug", message, context));
  }

  info(message: string, context?: LogContext): void {
    this.log(this.createEntry("info", message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.log(this.createEntry("warn", message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(this.createEntry("error", message, context, error));
  }
}

// Export singleton instance
export const logger = new ClientLogger();

// Export type for context
export type { LogContext };
