/**
 * Performance metrics and monitoring utilities for Pino logger.
 * Tracks logging performance, request metrics, and operation timings.
 */

import type { AfendaLogger, LogContext } from "./afenda.pino";
import type { LogLevel } from "../constant";

/**
 * Metrics snapshot at a point in time.
 */
export interface MetricsSnapshot {
  timestamp: number;
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  averageSerializationTime: number;
  peakMemoryUsage: number;
}

/**
 * Timer for measuring operation duration.
 */
export interface Timer {
  start(): void;
  end(ctx?: LogContext): number;
  duration(): number | null;
  log(logger: AfendaLogger, level?: LogLevel): void;
}

/**
 * Performance tracker state.
 */
interface PerformanceState {
  startTime: number;
  logs: number;
  byLevel: Map<LogLevel, number>;
  serializationTimes: number[];
  peakMemory: number;
}

/**
 * Create a performance metrics tracker.
 */
export function createMetricsTracker(opts: { maxHistorySize?: number } = {}) {
  const maxHistorySize = opts.maxHistorySize ?? 1000;
  const state: PerformanceState = {
    startTime: Date.now(),
    logs: 0,
    byLevel: new Map(),
    serializationTimes: [],
    peakMemory: 0,
  };

  return {
    recordLog: (level: LogLevel, serializationTime: number = 0) => {
      state.logs++;
      state.byLevel.set(level, (state.byLevel.get(level) ?? 0) + 1);

      if (serializationTime > 0) {
        state.serializationTimes.push(serializationTime);
        if (state.serializationTimes.length > maxHistorySize) {
          state.serializationTimes.shift();
        }
      }

      // Track memory if available
      if (typeof process !== "undefined" && process.memoryUsage) {
        const mem = process.memoryUsage();
        const heapUsed = mem.heapUsed;
        if (heapUsed > state.peakMemory) {
          state.peakMemory = heapUsed;
        }
      }
    },

    getSnapshot: (): MetricsSnapshot => {
      const logsByLevel: Record<string, number> = {};
      state.byLevel.forEach((count, level) => {
        logsByLevel[level] = count;
      });

      const avgSerializationTime =
        state.serializationTimes.length > 0
          ? state.serializationTimes.reduce((a, b) => a + b, 0) / state.serializationTimes.length
          : 0;

      return {
        timestamp: Date.now(),
        totalLogs: state.logs,
        logsByLevel: logsByLevel as Record<LogLevel, number>,
        averageSerializationTime: avgSerializationTime,
        peakMemoryUsage: state.peakMemory,
      };
    },

    reset: () => {
      state.logs = 0;
      state.byLevel.clear();
      state.serializationTimes = [];
      state.peakMemory = 0;
      state.startTime = Date.now();
    },
  };
}

/**
 * Create a timer for measuring operation duration.
 */
export function createTimer(label: string): Timer {
  let startTime: number | null = null;
  let endTime: number | null = null;

  return {
    start: () => {
      startTime = Date.now();
      endTime = null;
    },

    end: (_ctx?: LogContext) => {
      if (!startTime) {
        return 0;
      }
      endTime = Date.now();
      const duration = endTime - startTime;
      return duration;
    },

    duration: () => {
      if (!startTime) return null;
      if (endTime) return endTime - startTime;
      return Date.now() - startTime;
    },

    log: (logger: AfendaLogger, level: LogLevel = "info") => {
      const duration = endTime && startTime ? endTime - startTime : 0;
      logger[level](`${label} completed`, { label, duration: `${duration}ms` });
    },
  };
}

/**
 * Measure async function execution time.
 */
export async function measureAsync<T>(
  _label: string,
  fn: () => Promise<T>,
  onComplete?: (duration: number, result: T) => void
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    onComplete?.(duration, result);
    return result;
  } catch (err) {
    throw err;
  }
}

/**
 * Measure sync function execution time.
 */
export function measureSync<T>(
  label: string,
  fn: () => T,
  onComplete?: (duration: number, result: T) => void
): T {
  const startTime = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - startTime;
    onComplete?.(duration, result);
    return result;
  } catch (err) {
    throw err;
  }
}

/**
 * Performance warning thresholds.
 */
export interface PerformanceThresholds {
  slowLogMs?: number;
  slowSerializationMs?: number;
  highMemoryMb?: number;
}

/**
 * Analyze metrics against thresholds.
 */
export function analyzeMetrics(
  snapshot: MetricsSnapshot,
  thresholds: PerformanceThresholds = {}
): string[] {
  const warnings: string[] = [];
  const { slowSerializationMs = 50, highMemoryMb = 512 } = thresholds;

  if (snapshot.averageSerializationTime > slowSerializationMs) {
    warnings.push(`Slow serialization: ${snapshot.averageSerializationTime.toFixed(2)}ms (threshold: ${slowSerializationMs}ms)`);
  }

  const memoryMb = snapshot.peakMemoryUsage / (1024 * 1024);
  if (memoryMb > highMemoryMb) {
    warnings.push(`High memory usage: ${memoryMb.toFixed(2)}MB (threshold: ${highMemoryMb}MB)`);
  }

  const errorCount = snapshot.logsByLevel.error ?? 0;
  const fatalCount = snapshot.logsByLevel.fatal ?? 0;
  if (errorCount + fatalCount > 10) {
    warnings.push(`High error/fatal count: ${errorCount + fatalCount} (threshold: 10)`);
  }

  return warnings;
}
