# Drizzle Stage — DB Truth (Neon-first)

This folder is the **DB-truth drop-zone**.

**Hard rule:** any file that imports `drizzle-orm` / `drizzle-orm/pg-core` belongs here (and nowhere else).

## What this stage contains

### Core Components
- Reusable DB columns (tenant, timestamps, soft-delete, trace, meta)
- Connection adapters optimized for **Neon**:
  - `neon-http` (fast, single-shot, non-interactive transactions)
  - `neon-serverless` websockets (interactive transactions)
  - `neon-pool` (connection pooling for high-throughput apps)
- FK + index helpers
- RLS policy declarations **in schema** using Drizzle RLS API (Neon helper wrapper)

### Utilities (NEW)
- **Migration helpers** - Programmatic migration management and validation
- **Transaction wrappers** - Typed transactions with retry logic and error handling
- **Query utilities** - Pagination, filtering, sorting, batch operations
- **Zod bridge** - Runtime validation integration with Drizzle schemas
- **Neon optimizations** - Autoscaling, compute management, performance hints

### Domain Schema Snapshot
- `afenda.schema.ts` contains the first-party `afenda_*` tables with FK/index naming, shared column groups, and policies applied inline.
- Import from `@/afenda/src/drizzle/afenda.schema` (or via the package barrel) to stay in sync with DB truth.

## Connection Drivers

### HTTP Driver (Serverless/Edge)
```typescript
import { httpDb } from "@/drizzle/_drizzle.core.neon.http";
```
- Best for: Serverless functions, Edge runtime
- Pros: Fast, stateless, edge-compatible
- Cons: No interactive transactions

### WebSocket Driver (Interactive)
```typescript
import { createNeonWebSocketDb } from "@/drizzle/_drizzle.core.neon.ws";

const { db, close } = await createNeonWebSocketDb();
```
- Best for: Interactive transactions, long-running queries
- Pros: Full transaction support
- Cons: Requires WebSocket support

### Pool Driver (High-throughput)
```typescript
import { poolDb, closePool } from "@/drizzle/_drizzle.core.neon.pool";
```
- Best for: Server applications with high concurrency
- Pros: Connection pooling, better performance
- Cons: Requires cleanup on shutdown

### Environment Resolution
Neon URLs are resolved centrally via `_drizzle.env.ts`. It automatically:
- falls back across `DATABASE_URL`, `DATABASE_POOL_URL`, `DATABASE_WS_URL`
- enforces `sslmode=require`
- toggles query logging via `LOG_DB_QUERIES`

```typescript
import { resolveDatabaseUrl } from "@/drizzle/_drizzle.env";

const writerUrl = resolveDatabaseUrl("http");
```

All drivers consume this helper so you only need to manage env vars in one place.

## RLS Notes (Neon)

Drizzle supports attaching `pgPolicy(...)` (or Neon `crudPolicy(...)`) directly in the third argument to `pgTable`.
Neon also has docs explaining when RLS is required (e.g., client/Data API). See Neon RLS guides.

### Policy Helpers

This stage provides comprehensive RLS policy patterns:

#### Basic Policies
- `roles.neon.ts` – predefined Neon roles (authenticated, anonymous, admin)
- `policyUserOwnsRow` – user owns row via auth.user_id()
- `policyCrudForRole` – CRUD permissions by role
- `policyTenantIsCurrent` – multi-tenant isolation

#### Advanced Policies (NEW)
- `policyTimeWindow` – time-based access control
- `policyExcludeDeleted` – soft delete filtering
- `policyOrgMembership` – organization-based access
- `policyTeamAccess` – team-based access
- `policyMinimumRole` – role hierarchy enforcement
- `policyAuditLog` – audit trail protection
- `policyReadOnly` – read-only access
- `policyPublicRead` – public read, authenticated write

#### Example Usage
```typescript
import { pgTable, text } from "drizzle-orm/pg-core";
import { 
  policyUserOwnsRow, 
  policyOrgMembership,
  policyExcludeDeleted 
} from "@/drizzle/drizzle.policies.neon";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull(),
  orgId: text("org_id").notNull(),
  isDeleted: boolean("is_deleted").default(false),
}, (table) => ({
  userPolicy: policyUserOwnsRow(table.userId),
  orgPolicy: policyOrgMembership(table.orgId),
  softDeletePolicy: policyExcludeDeleted(table.isDeleted),
}));
```

## Transaction Utilities

### Basic Transaction
```typescript
import { withTransaction } from "@/drizzle/_drizzle.transaction";

await withTransaction(db, async (tx) => {
  await tx.insert(users).values({ name: "John" });
  await tx.insert(profiles).values({ userId: 1 });
});
```

### With Retry Logic
```typescript
await withTransaction(db, async (tx) => {
  // Your operations
}, {
  maxRetries: 3,
  retryDelay: 100,
  onRetry: (attempt, error) => console.log(`Retry ${attempt}`),
});
```

### Batch Operations
```typescript
import { batch } from "@/drizzle/_drizzle.transaction";

const [users, projects, tasks] = await batch(db, [
  (tx) => tx.insert(usersTable).values(userData),
  (tx) => tx.insert(projectsTable).values(projectData),
  (tx) => tx.insert(tasksTable).values(taskData),
]);
```

## Query Performance

### Pagination
```typescript
import { 
  getOffsetPagination, 
  buildPaginationMeta,
  cursorPaginate 
} from "@/drizzle/_drizzle.query.utils";

// Offset pagination
const { limit, offset } = getOffsetPagination({ page: 1, pageSize: 10 });
const items = await db.select().from(tasks).limit(limit).offset(offset);

// Cursor pagination
const { items, nextCursor, hasMore } = await cursorPaginate(
  db.select().from(tasks),
  { cursor: "abc123", pageSize: 10 }
);
```

### Filtering & Sorting
```typescript
import { buildFilters, buildSort } from "@/drizzle/_drizzle.query.utils";

const filters = buildFilters([
  { column: "status", operator: "eq", value: "active" },
  { column: "createdAt", operator: "gte", value: new Date() },
], tasksColumns);

const sorts = buildSort([
  { column: "createdAt", direction: "desc" },
], tasksColumns);
```

### Batch Operations
```typescript
import { batchInsert, batchUpdate } from "@/drizzle/_drizzle.query.utils";

// Batch insert with conflict handling
await batchInsert(db, tasks, records, {
  batchSize: 100,
  onConflict: "ignore",
});

// Batch update
await batchUpdate(db, tasks, updates, { batchSize: 50 });
```

## Zod Integration

### Schema Validation
```typescript
import { 
  createInsertSchema, 
  validateData,
  createValidator 
} from "@/drizzle/_drizzle.zod.bridge";

// Create insert schema
const insertTaskSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["todo", "done"]),
});

// Validate
const validated = validateData(insertTaskSchema, userData);

// Create validator middleware
const validateTask = createValidator(insertTaskSchema);
const task = validateTask(req.body);
```

## Neon Optimizations

### Autoscaling Configuration
```typescript
import { 
  getRecommendedAutoscaling,
  getRecommendedDriver,
  calculatePoolSize 
} from "@/drizzle/_drizzle.neon.optimizations";

// Get recommended config for environment
const config = getRecommendedAutoscaling("production");
// { minCu: 0.5, maxCu: 4, suspendTimeout: 0 }

// Get recommended driver
const driver = getRecommendedDriver("serverless"); // "http"

// Calculate pool size
const poolSize = calculatePoolSize({
  maxConnections: 100,
  concurrentRequests: 50,
  avgQueryDuration: 200,
});
```

### Performance Hints
```typescript
import { getPerformanceHints } from "@/drizzle/_drizzle.neon.optimizations";

const hints = getPerformanceHints("production");
// {
//   useConnectionPooling: true,
//   preferredDriver: "pool",
//   cacheStrategy: "stale-while-revalidate",
//   readReplica: true
// }
```

## Migration Management

### Check Migration Status
```typescript
import { 
  getAppliedMigrations,
  getMigrationHistory,
  validateSchema 
} from "@/drizzle/_drizzle.migration";

const history = await getMigrationHistory(db);
console.log(`Applied ${history.total} migrations`);

const validation = await validateSchema(db, ["users", "tasks", "projects"]);
if (!validation.isValid) {
  console.error("Missing tables:", validation.missing);
}
```

## File Structure

```
drizzle/
├── _drizzle.env.ts                 # Env + URL helpers (NEW)
├── _drizzle.core.neon.http.ts      # HTTP driver
├── _drizzle.core.neon.ws.ts        # WebSocket driver
├── _drizzle.core.neon.pool.ts      # Pool driver
├── _drizzle.core.table.ts          # Column helpers
├── _drizzle.core.index.ts          # Index helpers
├── _drizzle.core.relations.ts      # Relations helper
├── _drizzle.migration.ts           # Migration utilities
├── _drizzle.transaction.ts         # Transaction wrappers
├── _drizzle.query.utils.ts         # Query utilities
├── _drizzle.zod.bridge.ts          # Zod integration
├── _drizzle.neon.optimizations.ts  # Neon optimizations
├── drizzle.roles.neon.ts           # RLS roles
├── drizzle.policies.neon.ts        # RLS policies
├── afenda.schema.ts                # Afenda domain tables (NEW)
├── drizzle.schema.ts               # Schema exports
└── template.table.ts               # Reference template
```
