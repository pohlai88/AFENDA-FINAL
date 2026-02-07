# Pino Logger Best Practices

This guide demonstrates production-grade logging patterns using the enhanced Pino logger utilities.

## Core Concepts

### 1. Logger Creation and Configuration

```typescript
import { createLogger } from "./afenda.pino";
import { createConsoleSink, createFileSink, createMultiSink } from "./_pino.sinks";

// Basic logger
const logger = createLogger({
  name: "my-service",
  level: "info",
});

// With multiple sinks
const sink = createMultiSink(
  createConsoleSink(),
  createFileSink({ filepath: "./logs/app.log" })
);

const advancedLogger = createLogger({
  name: "api-service",
  level: "info",
  sink,
  getTraceId: () => getCurrentTraceId(), // From request context
});
```

### 2. Structured Logging

Always provide structured context with your logs:

```typescript
// ✅ Good: Structured data
logger.info("User login", {
  userId: user.id,
  email: user.email,
  ipAddress: req.ip,
  duration: loginTime,
});

// ❌ Bad: String concatenation
logger.info(`User ${user.id} logged in from ${req.ip}`);
```

### 3. Log Levels Explained

- **trace**: Detailed debugging information (default: disabled)
- **debug**: Detailed information for diagnosis (dev only)
- **info**: General informational messages (business events)
- **warn**: Warning conditions (recoverable issues)
- **error**: Error events (application errors)
- **fatal**: Critical system failures (service shutdown)

```typescript
logger.trace("Stack trace info", { stack: err.stack });
logger.debug("Request details", { headers: req.headers });
logger.info("Order created", { orderId: "123", amount: 99.99 });
logger.warn("Rate limit approaching", { current: 95, limit: 100 });
logger.error("Payment failed", { error: err.message, orderId: "123" });
logger.fatal("Database connection lost", { error: err.message });
```

### 4. Context Binding (Child Loggers)

Create child loggers for request or operation scoping:

```typescript
// Per-request logger with bound context
const requestLogger = logger.child({
  requestId: req.id,
  userId: req.user?.id,
  endpoint: req.path,
});

// All logs from requestLogger automatically include this context
requestLogger.info("Processing request"); // includes requestId, userId, endpoint
```

## Advanced Patterns

### 5. Middleware Stack

Compose middleware for filtering, redacting, and enriching:

```typescript
import {
  createFilterMiddleware,
  createRedactionMiddleware,
  createEnrichmentMiddleware,
  composeMiddlewares,
} from "./_pino.middleware";

const middleware = composeMiddlewares(
  // Filter out health check logs
  createFilterMiddleware({
    excludePatterns: [/health.*check/i],
  }),

  // Redact sensitive data
  createRedactionMiddleware([
    { pattern: /"password":\s*"[^"]+"/g, replacement: '"password": "[REDACTED]"' },
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: "[CARD]" },
  ]),

  // Enrich with environment info
  createEnrichmentMiddleware(() => ({
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  }))
);
```

### 6. Error Handling

Use proper error serialization:

```typescript
import { serializeError } from "./_pino.serializers";

try {
  await risky();
} catch (err) {
  logger.error("Operation failed", {
    error: serializeError(err),
    retryable: shouldRetry(err),
  });
}
```

### 7. Performance Monitoring

Track performance with metrics:

```typescript
import { createTimer, createMetricsTracker } from "./_pino.metrics";

// Timer pattern
const timer = createTimer("database-query");
timer.start();
const result = await db.query("...");
timer.end({ query: "SELECT..." });
timer.log(logger, "info");

// Metrics collector
const metrics = createMetricsTracker();
metrics.recordLog("info", serializationTime);
const snapshot = metrics.getSnapshot();
logger.info("Metrics snapshot", snapshot);
```

### 8. Testing

Use mock loggers in tests:

```typescript
import { createMockLogger, spyOnLogger } from "./_pino.testing";

test("logs user creation", () => {
  const logger = createMockLogger();
  const service = new UserService(logger);

  service.createUser({ email: "test@example.com" });

  expect(logger.hasLog("info", "User created")).toBe(true);
  expect(logger.getLastLog()).toMatchObject({
    level: "info",
    msg: expect.stringMatching(/created/),
  });
});

test("tracks error logs", () => {
  const logger = createMockLogger();
  const spy = spyOnLogger(logger);

  service.failingOperation();

  expect(spy.callCount("error")).toBeGreaterThan(0);
  spy.restore();
});
```

### 9. Request Context (Server)

Use async context for request-scoped logging:

```typescript
import { createRequestLoggerFactory } from "./_pino.integrations";
import { runWithRequestContext, getTraceIdFromContext } from "./afenda.pino.context";

// Express middleware
app.use((req, res, next) => {
  const loggerFactory = createRequestLoggerFactory(logger);
  const requestLogger = loggerFactory({
    traceId: req.id,
    userId: req.user?.id,
  });

  runWithRequestContext({ traceId: req.id }, () => {
    req.log = requestLogger;
    next();
  });
});

// In route handlers
router.post("/users", (req, res) => {
  req.log.info("Creating user", { email: req.body.email });
  // Automatically includes traceId from context
});
```

### 10. Batching and Buffering

For high-volume logging, use batching:

```typescript
import { createBatchingSink } from "./_pino.sinks";

const batchedSink = createBatchingSink(
  createFileSink({ filepath: "./logs/batch.log" }),
  100, // Batch size
  5000 // Flush interval (ms)
);

const logger = createLogger({
  name: "high-volume-service",
  sink: batchedSink,
});

// Logs are batched and flushed periodically
for (let i = 0; i < 1000; i++) {
  logger.info("Event", { index: i });
}

// Force flush before shutdown
batchedSink.flush();
```

## Production Checklist

- [ ] Use child loggers for request scoping
- [ ] Include trace IDs in all logs
- [ ] Redact sensitive data (passwords, tokens, PII)
- [ ] Use appropriate log levels
- [ ] Include structured context (avoid string concatenation)
- [ ] Monitor log volume and performance
- [ ] Filter verbose logs in production
- [ ] Route errors to alerting systems
- [ ] Test logging behavior in unit tests
- [ ] Document custom context fields

## Common Patterns

### Health Checks (Silent)

```typescript
logger.debug("Health check passed", { checks: ["db", "cache"] });
```

### Database Operations

```typescript
logger.debug("Query started", { query: "SELECT...", params: [1, 2] });
logger.info("Query completed", { duration: 45, rowCount: 100 });
```

### API Calls

```typescript
const timer = createTimer("external-api");
timer.start();
const result = await externalApi.fetch();
const duration = timer.end();

logger.info("External API call", {
  endpoint: "https://api.example.com/users",
  duration,
  statusCode: result.status,
});
```

### Async Operations

```typescript
const loggerFactory = createRequestLoggerFactory(logger);

async function processQueue() {
  const item = queue.dequeue();
  const itemLogger = loggerFactory({ itemId: item.id });

  try {
    itemLogger.info("Processing started");
    await process(item);
    itemLogger.info("Processing completed");
  } catch (err) {
    itemLogger.error("Processing failed", { error: serializeError(err) });
  }
}
```

## Environment-Based Configuration

```typescript
import { createEnvironmentAwareConfig } from "./_pino.integrations";

const config = createEnvironmentAwareConfig();
const logger = createLogger({
  name: "app",
  ...config,
});

// Automatically sets appropriate log level based on NODE_ENV
// - production: info
// - development: debug
// - test: error
```
