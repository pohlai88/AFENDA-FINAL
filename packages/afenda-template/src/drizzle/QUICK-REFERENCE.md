# NEON-Drizzle Quick Reference

## 🚀 Connection Drivers

```typescript
// HTTP (Serverless/Edge) - Fast, stateless
import { db } from "./_drizzle.core.neon.http";

// WebSocket (Interactive) - Full transaction support
import { db } from "./_drizzle.core.neon.ws";

// Pool (Production) - Best performance
import { db, closePool } from "./_drizzle.core.neon.pool";
```

## 🔒 RLS Policies (11 Patterns)

```typescript
import {
  policyUserOwnsRow,           // User owns row
  policyCrudForRole,            // CRUD by role
  policyTenantIsCurrent,        // Multi-tenant
  policyTimeWindow,             // Time-based
  policyExcludeDeleted,         // Soft delete
  policyOrgMembership,          // Org access
  policyTeamAccess,             // Team access
  policyMinimumRole,            // Role hierarchy
  policyAuditLog,               // Audit protection
  policyReadOnly,               // Read-only
  policyPublicRead,             // Public read
} from "./drizzle.policies.neon";
```

## 💾 Transactions

```typescript
import { withTransaction, batch } from "./_drizzle.transaction";

// Simple transaction
await withTransaction(db, async (tx) => {
  await tx.insert(users).values({ name: "John" });
});

// With retry
await withTransaction(db, async (tx) => {
  // operations
}, { maxRetries: 3 });

// Batch
const [r1, r2] = await batch(db, [
  (tx) => tx.insert(users).values(data1),
  (tx) => tx.insert(tasks).values(data2),
]);
```

## 📄 Pagination

```typescript
import { cursorPaginate, getOffsetPagination } from "./_drizzle.query.utils";

// Cursor (recommended)
const { items, nextCursor, hasMore } = await cursorPaginate(
  db.select().from(tasks),
  { cursor: req.query.cursor, pageSize: 20 }
);

// Offset
const { limit, offset } = getOffsetPagination({ page: 1, pageSize: 10 });
```

## 🔍 Filtering & Sorting

```typescript
import { buildFilters, buildSort } from "./_drizzle.query.utils";

const filters = buildFilters([
  { column: "status", operator: "eq", value: "active" },
  { column: "createdAt", operator: "gte", value: startDate },
], tasksColumns);

const sorts = buildSort([
  { column: "createdAt", direction: "desc" },
], tasksColumns);
```

## 📦 Batch Operations

```typescript
import { batchInsert, batchUpdate } from "./_drizzle.query.utils";

// Insert
await batchInsert(db, tasks, records, {
  batchSize: 100,
  onConflict: "ignore",
});

// Update
await batchUpdate(db, tasks, updates, { batchSize: 50 });
```

## ✅ Validation (Zod)

```typescript
import { validateData, createValidator } from "./_drizzle.zod.bridge";

// Direct validation
const data = validateData(schema, input);

// Create middleware
const validate = createValidator(schema);
const validated = validate(req.body);
```

## ⚡ Neon Optimizations

```typescript
import { 
  getRecommendedAutoscaling,
  getRecommendedDriver,
  calculatePoolSize,
  getPerformanceHints,
} from "./_drizzle.neon.optimizations";

// Autoscaling for production
const config = getRecommendedAutoscaling("production");
// { minCu: 0.5, maxCu: 4, suspendTimeout: 0 }

// Driver selection
const driver = getRecommendedDriver("serverless"); // "http"

// Pool sizing
const poolSize = calculatePoolSize({
  concurrentRequests: 50,
  avgQueryDuration: 200,
});

// Performance hints
const hints = getPerformanceHints("production");
```

## 🔧 Migrations

```typescript
import { 
  getAppliedMigrations,
  getMigrationHistory,
  validateSchema,
} from "./_drizzle.migration";

// Check status
const history = await getMigrationHistory(db);
console.log(`Applied: ${history.total}`);

// Validate schema
const validation = await validateSchema(db, ["users", "tasks"]);
if (!validation.isValid) {
  console.error("Missing:", validation.missing);
}
```

## 📊 Column Helpers

```typescript
import { 
  pkUuid,
  tenantCols,
  timeCols,
  actorCols,
  softDeleteCols,
  traceCols,
  metaCols,
} from "./_drizzle.core.table";

export const myTable = pgTable("my_table", {
  id: pkUuid(),
  ...tenantCols(),
  ...timeCols(),
  ...actorCols(),
  ...softDeleteCols(),
  ...metaCols(),
});
```

## 🎯 Index Helpers

```typescript
import { idx, uidx } from "./_drizzle.core.index";

export const myTable = pgTable("my_table", {
  // columns
}, (table) => ({
  emailIdx: idx("email_idx").on(table.email),
  slugIdx: uidx("slug_idx").on(table.slug),
}));
```

## 🔗 Environment Configuration

```env
# Required
DATABASE_URL=postgresql://user:pass@host/db

# For pooling (optional)
DATABASE_POOL_URL=postgresql://user:pass@host/db?pooler=true

# Neon project info
NEON_PROJECT_ID=dark-band-87285012
NEON_BRANCH_ID=br-icy-darkness-a1eom4rq
```

## 📁 File Organization

```
Import pattern: _drizzle.<category>.<feature>.ts

Core:
  _drizzle.core.table.ts          # Column helpers
  _drizzle.core.index.ts          # Index helpers
  _drizzle.core.relations.ts      # Relations
  _drizzle.core.neon.http.ts      # HTTP driver
  _drizzle.core.neon.ws.ts        # WebSocket driver
  _drizzle.core.neon.pool.ts      # Pool driver

Utilities:
  _drizzle.migration.ts           # Migration utils
  _drizzle.transaction.ts         # Transaction wrappers
  _drizzle.query.utils.ts         # Query utilities
  _drizzle.zod.bridge.ts          # Zod integration
  _drizzle.neon.optimizations.ts  # Neon optimizations

Config:
  drizzle.roles.neon.ts           # RLS roles
  drizzle.policies.neon.ts        # RLS policies
  drizzle.schema.ts               # Main exports
  drizzle.config.template.ts      # Drizzle config
```

## 🚦 Quick Start

1. **Choose driver:**
   ```typescript
   import { db } from "@/drizzle/_drizzle.core.neon.pool";
   ```

2. **Add RLS policies:**
   ```typescript
   import { policyUserOwnsRow } from "@/drizzle/drizzle.policies.neon";
   ```

3. **Use transactions:**
   ```typescript
   import { withTransaction } from "@/drizzle/_drizzle.transaction";
   ```

4. **Add pagination:**
   ```typescript
   import { cursorPaginate } from "@/drizzle/_drizzle.query.utils";
   ```

5. **Validate input:**
   ```typescript
   import { validateData } from "@/drizzle/_drizzle.zod.bridge";
   ```

Done! 🎉
