/**
 * Log sink implementations for different outputs.
 * Supports console, file, stream, and cloud-based logging.
 */

import type { LogLevel } from "../constant";

/**
 * Sink function type - receives log line and level.
 */
export type LogSink = (line: string, level: LogLevel) => void;

/**
 * Configuration for file-based sinking.
 */
export interface FileSinkConfig {
  filepath: string;
  maxSize?: number; // bytes
  maxFiles?: number;
  encoding?: BufferEncoding;
}

/**
 * Configuration for stream-based sinking.
 */
export interface StreamSinkConfig {
  stream: NodeJS.WritableStream;
  includeTimestamp?: boolean;
}

/**
 * Create a console sink (default).
 */
export function createConsoleSink(): LogSink {
  return (line: string, level: LogLevel) => {
    if (level === "error" || level === "fatal") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  };
}

/**
 * Create a no-op sink (for testing/silent logging).
 */
export function createNoOpSink(): LogSink {
  return () => {
    // No-op
  };
}

/**
 * Create a memory buffer sink (for testing).
 */
export function createMemorySink(): LogSink & { getBuffer: () => string[]; clear: () => void } {
  const buffer: string[] = [];
  const maxSize = 10000;

  const sink: LogSink = (line: string) => {
    buffer.push(line);
    if (buffer.length > maxSize) {
      buffer.shift();
    }
  };

  return Object.assign(sink, {
    getBuffer: () => [...buffer],
    clear: () => {
      buffer.length = 0;
    },
  });
}

/**
 * Create a filter sink that conditionally forwards logs.
 */
export function createFilterSink(
  predicate: (line: string, level: LogLevel) => boolean,
  fallback?: LogSink
): LogSink {
  const defaultSink = fallback ?? createConsoleSink();

  return (line: string, level: LogLevel) => {
    if (predicate(line, level)) {
      defaultSink(line, level);
    }
  };
}

/**
 * Create a multi-sink that broadcasts to multiple sinks.
 */
export function createMultiSink(...sinks: LogSink[]): LogSink {
  return (line: string, level: LogLevel) => {
    for (const sink of sinks) {
      try {
        sink(line, level);
      } catch (err) {
        // Prevent one failing sink from affecting others
        console.error(`[Pino] Sink error: ${String(err)}`);
      }
    }
  };
}

/**
 * Create a batching sink that collects logs before sending.
 */
export function createBatchingSink(
  downstreamSink: LogSink,
  batchSize: number = 100,
  flushIntervalMs: number = 5000
): LogSink & { flush: () => void } {
  let batch: Array<[string, LogLevel]> = [];
  let flushTimer: NodeJS.Timeout | null = null;

  const flush = () => {
    if (batch.length === 0) return;

    for (const [line, level] of batch) {
      try {
        downstreamSink(line, level);
      } catch (err) {
        console.error(`[Pino] Batch sink error: ${String(err)}`);
      }
    }

    batch = [];
  };

  const scheduleFlush = () => {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, flushIntervalMs);
  };

  const sink: LogSink = (line: string, level: LogLevel) => {
    batch.push([line, level]);

    if (batch.length >= batchSize) {
      flush();
    } else {
      scheduleFlush();
    }
  };

  return Object.assign(sink, { flush });
}

/**
 * Create a rotating file sink (Node.js only, returns console sink in browsers).
 */
export function createFileSink(config: FileSinkConfig): LogSink {
  // Browser fallback
  if (typeof window !== "undefined" || typeof require === "undefined") {
    return createConsoleSink();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fs: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let path: any;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    path = require("path");
  } catch {
    return createConsoleSink();
  }

  let _currentFile: string | null = null;
  let currentSize = 0;
  let fileIndex = 0;

  const getFilePath = (index: number): string => {
    const dir = path.dirname(config.filepath);
    const ext = path.extname(config.filepath);
    const base = path.basename(config.filepath, ext);
    return index === 0 ? config.filepath : path.join(dir, `${base}.${index}${ext}`);
  };

  const rotateFile = () => {
    const maxFiles = config.maxFiles ?? 5;
    fileIndex++;
    _currentFile = null;
    currentSize = 0;

    if (fileIndex >= maxFiles) {
      fileIndex = 0;
    }
  };

  const sink: LogSink = (line: string) => {
    try {
      const _filePath = getFilePath(fileIndex);
      const maxSize = config.maxSize ?? 10 * 1024 * 1024; // 10MB default
      const encoding = config.encoding ?? "utf8";

      const lineWithNewline = `${line}\n`;
      const lineSize = Buffer.byteLength(lineWithNewline, encoding);

      if (currentSize + lineSize > maxSize) {
        rotateFile();
      }

      fs.appendFileSync(getFilePath(fileIndex), lineWithNewline, encoding);
      currentSize += lineSize;
    } catch (err) {
      console.error(`[Pino] File sink error: ${String(err)}`);
    }
  };

  return sink;
}

/**
 * Create a stream sink (Node.js).
 */
export function createStreamSink(config: StreamSinkConfig): LogSink {
  const { stream, includeTimestamp = false } = config;

  return (line: string, _level: LogLevel) => {
    try {
      let output = line;
      if (includeTimestamp) {
        output = `[${new Date().toISOString()}] ${line}`;
      }

      stream.write(`${output}\n`);
    } catch (err) {
      console.error(`[Pino] Stream sink error: ${String(err)}`);
    }
  };
}

/**
 * Create a cloud/HTTP sink (e.g., for Datadog, CloudWatch, etc).
 */
export function createHttpSink(config: {
  url: string;
  apiKey?: string;
  method?: string;
  headers?: Record<string, string>;
  batchSize?: number;
  retries?: number;
}): LogSink {
  const batchSize = config.batchSize ?? 10;
  const retries = config.retries ?? 3;
  let batch: string[] = [];
  let sending = false;

  const send = async (lines: string[]) => {
    if (lines.length === 0) return;

    const body = JSON.stringify({
      logs: lines.map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      }),
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(config.headers ?? {}),
    };

    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Only works in Node.js or fetch-enabled environments
        if (typeof fetch === "undefined") {
          return; // Fallback to console if fetch not available
        }

        const response = await fetch(config.url, {
          method: config.method ?? "POST",
          headers,
          body,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
      }
    }

    console.error(`[Pino] HTTP sink failed after ${retries} retries:`, lastErr?.message);
  };

  const sink: LogSink = (line: string) => {
    batch.push(line);

    if (batch.length >= batchSize && !sending) {
      const toSend = batch;
      batch = [];
      sending = true;

      send(toSend)
        .catch(() => {
          // Already logged in send()
        })
        .finally(() => {
          sending = false;
        });
    }
  };

  return sink;
}
