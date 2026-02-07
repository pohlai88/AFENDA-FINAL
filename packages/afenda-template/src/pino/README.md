# Pino Logger - Enhanced Edition

A production-grade, structured logging library for Afenda with full TypeScript support, comprehensive middleware, performance metrics, and framework integrations.

## Features

- ✅ **Structured Logging**: JSON-based output with rich context
- ✅ **Multiple Sinks**: Console, file, stream, HTTP, and custom destinations
- ✅ **Middleware System**: Filtering, redaction, enrichment, and more
- ✅ **Type Safe**: Full TypeScript with strict mode
- ✅ **Context Binding**: Request/operation scoped loggers
- ✅ **Performance Tracking**: Built-in metrics and timers
- ✅ **Testing Utilities**: Mock loggers, spies, and assertions
- ✅ **Framework Integration**: Next.js, Express, and generic server patterns
- ✅ **Browser Compatible**: Works in Node.js, browsers, and edge environments
- ✅ **Zero Dependencies**: Core logger has no external dependencies

## Quick Start

```typescript
import { createLogger } from "./pino";

const logger = createLogger({
  name: "my-service",
  level: "info",
});

// Log with structured context
logger.info("User login", {
  userId: user.id,
  ipAddress: req.ip,
  duration: loginTime,
});

// Create request-scoped child logger
const requestLogger = logger.child({
  requestId: req.id,
  userId: req.user?.id,
});

requestLogger.info("Processing request");
```

## Core Modules

### afenda.pino.ts
Main logger factory with core functionality:
- Create logger instances with configuration
- Log methods (trace, debug, info, warn, error, fatal)
- Child logger creation for context binding
- Custom sink support
- Automatic trace ID integration

### afenda.pino.context.ts
Request context management:
- AsyncLocalStorage for Node.js
- Browser/edge fallback support
- Request-scoped context retrieval
- Trace ID management

### afenda.pino.trace.ts
Trace ID generation:
- UUID-based generation (crypto.randomUUID)
- Fallback time-based generation
- Custom prefix support
- Deterministic ID creation

## Enhanced Modules

### _pino.types.ts
Type utilities and definitions:
- `ExtendedLogger`: Logger with additional methods
- `LoggerConfig`: Enhanced configuration type
- Type guards: `isLogContext()`, `isLogLevel()`
- Context builders and utilities
- Safe serialization functions

**Example:**
```typescript
import { ExtendedLogger, LogContextData, createRedactionFilter } from "./pino";

const redact = createRedactionFilter(["password", "token", "apiKey"]);
const cleanContext = redact(ctx);
```

### _pino.middleware.ts
Middleware for log transformation:
- **createFilterMiddleware**: Exclude/include logs by pattern
- **createRedactionMiddleware**: Mask sensitive data
- **createFormattingMiddleware**: Transform output format
- **createMetricsMiddleware**: Collect statistics
- **createDeduplicationMiddleware**: Skip duplicate logs
- **createRateLimitMiddleware**: Limit logs per level
- **createEnrichmentMiddleware**: Add automatic context
- **createConditionalMiddleware**: Apply conditionally
- **composeMiddlewares**: Combine multiple middleware

**Example:**
```typescript
import { createRedactionMiddleware, STANDARD_REDACTION_RULES } from "./pino";

const redaction = createRedactionMiddleware(STANDARD_REDACTION_RULES);
const sink = (next) => redaction((line, level) => console.log(line));
```

### _pino.serializers.ts
Safe object serialization:
- `safeSerialize()`: Universal serialization with depth control
- `serializeError()`: Error objects with stack traces
- `serializeHttpRequest()`: Request objects
- `serializeHttpResponse()`: Response objects
- `serializeHeaders()`: Headers with auto-redaction
- `redactContextFields()`: Field-level redaction

**Example:**
```typescript
import { serializeError } from "./pino";

try {
  await operation();
} catch (err) {
  logger.error("Failed", { error: serializeError(err) });
}
```

### _pino.metrics.ts
Performance monitoring:
- `createMetricsTracker()`: Track logs and performance
- `createTimer()`: Measure operation duration
- `measureAsync()`: Async operation measurement
- `measureSync()`: Sync operation measurement
- `analyzeMetrics()`: Compare against thresholds

**Example:**
```typescript
import { createTimer } from "./pino";

const timer = createTimer("database-query");
timer.start();
const result = await db.query("...");
timer.log(logger, "info");
```

### _pino.sinks.ts
Log destination implementations:
- `createConsoleSink()`: Console output (default)
- `createNoOpSink()`: Silent logging
- `createMemorySink()`: In-memory buffer (testing)
- `createFilterSink()`: Conditional forwarding
- `createMultiSink()`: Broadcast to multiple sinks
- `createBatchingSink()`: Batch before sending
- `createFileSink()`: Rotating file sink
- `createStreamSink()`: WritableStream sink
- `createHttpSink()`: Remote/cloud logging

**Example:**
```typescript
import { createMultiSink, createConsoleSink, createFileSink } from "./pino";

const sink = createMultiSink(
  createConsoleSink(),
  createFileSink({ filepath: "./logs/app.log", maxSize: 10 * 1024 * 1024 })
);

const logger = createLogger({ name: "app", sink });
```

### _pino.testing.ts
Test utilities and mock loggers:
- `createMockLogger()`: Full-featured mock
- `spyOnLogger()`: Track method calls
- `createLogCollector()`: Collect logs from async operations
- `withSuppressedConsole()`: Suppress output in tests
- Test assertions and helpers

**Example:**
```typescript
import { createMockLogger } from "./pino";

test("logs user creation", () => {
  const logger = createMockLogger();
  const service = new UserService(logger);

  service.createUser({ email: "test@example.com" });

  expect(logger.hasLog("info", "User created")).toBe(true);
});
```

### _pino.integrations.ts
Framework-specific integrations:
- **Next.js**: Context middleware, API route wrapper
- **Express**: Request middleware, error handler
- **Server**: Request-scoped logger factory, async wrapper
- **Client**: Remote logging with sendBeacon
- **Environment**: Auto-configuration by NODE_ENV

**Example:**
```typescript
import { ExpressIntegration } from "./pino";

const app = express();
app.use(ExpressIntegration.createMiddleware(logger));
app.use(ExpressIntegration.createErrorMiddleware(logger));
```

## Documentation

- **[BEST-PRACTICES.md](./BEST-PRACTICES.md)**: Comprehensive usage guide with real-world examples
- **[OPTIMIZATION-SUMMARY.md](./OPTIMIZATION-SUMMARY.md)**: Complete feature overview and statistics

## Common Patterns

### Child Loggers for Request Scoping
```typescript
const requestLogger = logger.child({
  requestId: req.id,
  userId: req.user?.id,
  endpoint: req.path,
});

// All logs automatically include context
requestLogger.info("Processing request");
```

### Error Handling
```typescript
try {
  await riskyOperation();
} catch (err) {
  logger.error("Operation failed", {
    error: serializeError(err),
    retryable: isRetryable(err),
  });
}
```

### Performance Measurement
```typescript
const timer = createTimer("api-call");
timer.start();
const response = await fetch(url);
const duration = timer.end();

logger.info("API call completed", { duration, status: response.status });
```

### Sensitive Data Redaction
```typescript
const redaction = createRedactionMiddleware([
  { pattern: /"password":\s*"[^"]+"/g, replacement: '"password": "[REDACTED]"' },
  { pattern: /Authorization:\s*Bearer\s+\S+/gi, replacement: "Authorization: Bearer [REDACTED]" },
]);
```

### Multi-Sink Setup
```typescript
const sink = createMultiSink(
  createConsoleSink(),
  createFileSink({ filepath: "./logs/app.log" }),
  createHttpSink({ url: "https://logs.example.com/api/logs" })
);
```

## API Reference

### Logger Methods
```typescript
interface AfendaLogger {
  level: LogLevel;
  name: string;
  
  child(ctx: LogContext): AfendaLogger;
  
  trace(msg: string, ctx?: LogContext): void;
  debug(msg: string, ctx?: LogContext): void;
  info(msg: string, ctx?: LogContext): void;
  warn(msg: string, ctx?: LogContext): void;
  error(msg: string, ctx?: LogContext): void;
  fatal(msg: string, ctx?: LogContext): void;
}
```

### Configuration
```typescript
interface CreateLoggerOptions {
  name: string;
  level?: LogLevel | string;
  base?: LogContext;
  sink?: (line: string, level: LogLevel) => void;
  getTraceId?: () => string | undefined;
}
```

### Log Levels
- **trace** (10): Most verbose, detailed debugging
- **debug** (20): Debugging information for diagnosis
- **info** (30): General informational messages
- **warn** (40): Warning conditions
- **error** (50): Error events
- **fatal** (60): Critical system failures

## Performance

- Zero-copy logging architecture
- Efficient JSON serialization
- Minimal memory footprint
- Batch processing support
- Rate limiting to prevent log flooding

## Browser Support

- ✅ Chrome/Edge 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Node.js 14+

## Testing

Comprehensive testing utilities included:

```typescript
import { createMockLogger, spyOnLogger } from "./pino";

// Mock logger for unit tests
const logger = createMockLogger();

// Spy on real logger
const spy = spyOnLogger(realLogger);
operation();
expect(spy.callCount("error")).toBe(0);
```

## Migration Guide

### From Basic Logger
```typescript
// Before
const logger = createLogger({ name: "app" });

// After (with sinks and middleware)
const logger = createLogger({
  name: "app",
  sink: createMultiSink(createConsoleSink(), createFileSink({ filepath: "./logs/app.log" })),
});
```

### Adding Framework Integration
```typescript
// Express
app.use(ExpressIntegration.createMiddleware(logger));

// Next.js
const requestLogger = NextJsIntegration.createContextMiddleware(logger)(ctx);
```

## License

Part of Afenda project - All rights reserved

## Contributing

See project guidelines for contribution standards.
