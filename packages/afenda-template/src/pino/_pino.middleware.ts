/**
 * Middleware utilities for Pino logger.
 * Provides filtering, formatting, redaction, and transformation capabilities.
 */

import type { LogLevel } from "../constant";

/**
 * Logger middleware function type.
 */
export type LoggerMiddleware = (
  next: (line: string, level: LogLevel) => void
) => (line: string, level: LogLevel) => void;

/**
 * Redaction rule for sensitive data.
 */
export interface RedactionRule {
  pattern: RegExp | string;
  replacement: string;
}

/**
 * Filtering configuration.
 */
export interface FilterConfig {
  minLevel?: LogLevel;
  maxLevel?: LogLevel;
  excludePatterns?: RegExp[];
  includePatterns?: RegExp[];
}

/**
 * Create a filtering middleware.
 * Only allows logs that match criteria.
 */
export function createFilterMiddleware(config: FilterConfig): LoggerMiddleware {
  const excludePatterns = config.excludePatterns ?? [];
  const includePatterns = config.includePatterns ?? [];

  return (next) => (line, level) => {
    // Check exclude patterns
    if (excludePatterns.some((p) => p.test(line))) {
      return;
    }

    // Check include patterns (if any specified)
    if (includePatterns.length > 0 && !includePatterns.some((p) => p.test(line))) {
      return;
    }

    next(line, level);
  };
}

/**
 * Create a redaction middleware.
 * Removes or masks sensitive data in logs.
 */
export function createRedactionMiddleware(rules: RedactionRule[]): LoggerMiddleware {
  return (next) => (line, level) => {
    let redacted = line;

    for (const rule of rules) {
      const pattern = typeof rule.pattern === "string" ? new RegExp(rule.pattern, "g") : rule.pattern;
      redacted = redacted.replace(pattern, rule.replacement);
    }

    next(redacted, level);
  };
}

/**
 * Standard redaction rules for common sensitive data.
 */
export const STANDARD_REDACTION_RULES: RedactionRule[] = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]" },
  // Credit card patterns
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: "[CARD]" },
  // API keys (common patterns)
  {
    pattern: /"api[_-]?key":\s*"[^"]+"/gi,
    replacement: '"api_key": "[REDACTED]"',
  },
  // Passwords
  {
    pattern: /"password":\s*"[^"]+"/gi,
    replacement: '"password": "[REDACTED]"',
  },
  // Authorization headers
  { pattern: /Authorization:\s*Bearer\s+\S+/gi, replacement: "Authorization: Bearer [REDACTED]" },
];

/**
 * Create a formatting middleware.
 * Transforms log output format.
 */
export function createFormattingMiddleware(formatter: (line: string, level: LogLevel) => string): LoggerMiddleware {
  return (next) => (line, level) => {
    const formatted = formatter(line, level);
    next(formatted, level);
  };
}

/**
 * Create a metrics-collecting middleware.
 * Collects statistics about logged messages.
 */
export function createMetricsMiddleware(): {
  middleware: LoggerMiddleware;
  getMetrics: () => Record<LogLevel, number>;
  reset: () => void;
} {
  const metrics: Record<string, number> = {};

  const middleware: LoggerMiddleware = (next) => (line, level) => {
    metrics[level] = (metrics[level] ?? 0) + 1;
    next(line, level);
  };

  return {
    middleware,
    getMetrics: () => metrics as Record<LogLevel, number>,
    reset: () => {
      for (const key in metrics) {
        delete metrics[key];
      }
    },
  };
}

/**
 * Compose multiple middlewares.
 */
export function composeMiddlewares(...middlewares: LoggerMiddleware[]): LoggerMiddleware {
  return (next) => {
    let composed = next;
    for (let i = middlewares.length - 1; i >= 0; i--) {
      composed = middlewares[i](composed);
    }
    return composed;
  };
}

/**
 * Create a deduplication middleware.
 * Prevents logging the same message multiple times within a time window.
 */
export function createDeduplicationMiddleware(windowMs: number = 5000): LoggerMiddleware {
  const recent = new Map<string, number>();

  return (next) => (line, level) => {
    const key = `${level}:${line}`;
    const now = Date.now();
    const lastSeen = recent.get(key);

    if (lastSeen && now - lastSeen < windowMs) {
      return; // Duplicate within window, skip
    }

    recent.set(key, now);

    // Cleanup old entries
    const threshold = now - windowMs;
    for (const [k, timestamp] of recent.entries()) {
      if (timestamp < threshold) {
        recent.delete(k);
      }
    }

    next(line, level);
  };
}

/**
 * Create a rate-limiting middleware.
 * Limits logs per level within a time window.
 */
export function createRateLimitMiddleware(config: Record<LogLevel, number>): LoggerMiddleware {
  const counters = new Map<LogLevel, { count: number; resetAt: number }>();

  const getLevelLimit = (level: LogLevel): number => config[level] ?? 100;

  return (next) => (line, level) => {
    const now = Date.now();
    const current = counters.get(level) ?? { count: 0, resetAt: now + 1000 };

    // Reset counter if window expired
    if (now >= current.resetAt) {
      current.count = 0;
      current.resetAt = now + 1000;
    }

    // Check limit
    const limit = getLevelLimit(level);
    if (current.count >= limit) {
      return; // Rate limit exceeded
    }

    current.count++;
    counters.set(level, current);

    next(line, level);
  };
}

/**
 * Create context enrichment middleware.
 * Adds environment or request-scoped data to logs.
 */
export function createEnrichmentMiddleware(
  enricher: (line: string, level: LogLevel) => Record<string, unknown>
): LoggerMiddleware {
  return (next) => (line, level) => {
    try {
      const parsed = JSON.parse(line);
      const enriched = { ...parsed, ...enricher(line, level) };
      next(JSON.stringify(enriched), level);
    } catch {
      // If parsing fails, just pass through
      next(line, level);
    }
  };
}

/**
 * Create a conditional middleware.
 * Only applies inner middleware if condition matches.
 */
export function createConditionalMiddleware(
  condition: (line: string, level: LogLevel) => boolean,
  middleware: LoggerMiddleware
): LoggerMiddleware {
  return (next) => {
    const wrapped = middleware(next);
    return (line, level) => {
      if (condition(line, level)) {
        wrapped(line, level);
      } else {
        next(line, level);
      }
    };
  };
}
