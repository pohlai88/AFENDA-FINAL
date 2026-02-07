# Drizzle Schema Declaration

Complete reference for defining database schemas with Drizzle ORM.

## Table Declaration

### Basic Table

```typescript
import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  email: text().notNull().unique(),
  createdAt: timestamp().defaultNow(),
});
```

### Schema Organization

**Single file approach** (small projects):
```typescript
// schema.ts
export const users = pgTable('users', { ... });
export const posts = pgTable('posts', { ... });
export const comments = pgTable('comments', { ... });
```

**Multi-file approach** (large projects):
```typescript
// schema/users.ts
export const users = pgTable('users', { ... });
export const profileInfo = pgTable('profile_info', { ... });

// schema/posts.ts
export const posts = pgTable('posts', { ... });
export const comments = pgTable('comments', { ... });

// schema/index.ts
export * from './users';
export * from './posts';
```

## Column Casing

By default column names use camelCase. Use `casing` option for automatic conversion:

```typescript
// drizzle.config.ts
export default defineConfig({
  dialect: 'postgresql',
  casing: 'snake_case', // Auto-convert camelCase → snake_case
});
```

```typescript
// Schema uses camelCase
const users = pgTable('users', {
  id: integer(),
  firstName: text(), // → first_name in DB
  lastName: text(),  // → last_name in DB
});
```

## PostgreSQL Schemas (pgSchema)

Organize tables in custom PostgreSQL schemas:

```typescript
import { pgSchema, serial, text } from 'drizzle-orm/pg-core';

export const mySchema = pgSchema('my_schema');

export const users = mySchema.table('users', {
  id: serial().primaryKey(),
  name: text(),
});

// Queries prepend schema: SELECT * FROM "my_schema"."users"
```

### Enums in Custom Schemas

```typescript
export const mySchema = pgSchema('my_schema');

export const colors = mySchema.enum('colors', ['red', 'green', 'blue']);

export const items = mySchema.table('items', {
  id: serial().primaryKey(),
  color: colors().default('red'),
});
```

## PostgreSQL Column Types

### Integer Types

```typescript
import { 
  integer, smallint, bigint, 
  serial, smallserial, bigserial 
} from 'drizzle-orm/pg-core';

const table = pgTable('numbers', {
  // Regular integers
  int: integer(),           // 4 bytes, -2147483648 to 2147483647
  small: smallint(),        // 2 bytes, -32768 to 32767
  big: bigint({ mode: 'number' }), // 8 bytes, use 'bigint' mode for large values
  
  // Auto-incrementing (serial types)
  id: serial().primaryKey(),           // 4 bytes
  smallId: smallserial().primaryKey(), // 2 bytes
  bigId: bigserial({ mode: 'number' }).primaryKey(), // 8 bytes
});
```

**BigInt Modes:**
- `mode: 'number'` - Returns JS `number` (limited precision)
- `mode: 'bigint'` - Returns JS `BigInt` (full precision)

### Identity Columns (Recommended over Serial)

```typescript
const users = pgTable('users', {
  // Always generated - cannot be overridden
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  
  // By default generated - can be overridden on insert
  code: integer().generatedByDefaultAsIdentity(),
  
  // Custom sequence options
  customId: integer().generatedAlwaysAsIdentity({
    name: 'custom_seq',
    startWith: 1000,
    increment: 10,
    minValue: 1000,
    maxValue: 9999,
    cycle: true,
    cache: 20,
  }),
});
```

### Text Types

```typescript
import { text, varchar, char } from 'drizzle-orm/pg-core';

const table = pgTable('texts', {
  // Unlimited text
  bio: text(),
  
  // Variable length with max
  name: varchar({ length: 255 }),
  
  // Fixed length
  code: char({ length: 6 }),
  
  // Text with enum constraint
  status: text({ enum: ['pending', 'active', 'archived'] }),
});
```

### Boolean

```typescript
import { boolean } from 'drizzle-orm/pg-core';

const users = pgTable('users', {
  isActive: boolean().default(true),
  verified: boolean().notNull().default(false),
});
```

### Numeric/Decimal Types

```typescript
import { numeric, decimal, real, doublePrecision } from 'drizzle-orm/pg-core';

const products = pgTable('products', {
  // Exact numeric with precision and scale
  price: numeric({ precision: 10, scale: 2 }), // e.g., 99999999.99
  
  // Alias for numeric
  cost: decimal({ precision: 10, scale: 2 }),
  
  // Approximate floating point
  rating: real(),                    // 4 bytes
  coordinates: doublePrecision(),    // 8 bytes
});
```

### Date/Time Types

```typescript
import { 
  timestamp, date, time, interval 
} from 'drizzle-orm/pg-core';

const events = pgTable('events', {
  // Timestamp with modes
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }),        // Returns JS Date
  scheduledAt: timestamp({ mode: 'string' }),    // Returns ISO string
  
  // Timestamp with timezone
  publishedAt: timestamp({ withTimezone: true }),
  
  // Date only
  birthDate: date(),
  eventDate: date({ mode: 'date' }), // Returns JS Date
  
  // Time only
  startTime: time(),
  endTime: time({ withTimezone: true }),
  
  // Duration
  duration: interval(),
});
```

### UUID

```typescript
import { uuid } from 'drizzle-orm/pg-core';

const users = pgTable('users', {
  // Manual UUID
  id: uuid().primaryKey(),
  
  // Auto-generated UUID (recommended)
  id: uuid().primaryKey().defaultRandom(),
});
```

### JSON/JSONB

```typescript
import { json, jsonb } from 'drizzle-orm/pg-core';

const users = pgTable('users', {
  // Stored as text (slower queries)
  settings: json(),
  
  // Binary format (faster queries, indexable)
  metadata: jsonb(),
  
  // With TypeScript type
  config: jsonb().$type<{
    theme: 'light' | 'dark';
    notifications: boolean;
  }>(),
});
```

### Arrays (PostgreSQL Only)

```typescript
import { text, integer } from 'drizzle-orm/pg-core';

const posts = pgTable('posts', {
  tags: text().array(),              // text[]
  scores: integer().array(),          // integer[]
  matrix: integer().array().array(),  // integer[][] (2D array)
});
```

### Binary Data

```typescript
import { bytea } from 'drizzle-orm/pg-core';

const files = pgTable('files', {
  data: bytea(),
});
```

### PostgreSQL Enums

```typescript
import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

// Define enum type
export const statusEnum = pgEnum('status', ['pending', 'active', 'archived']);
export const roleEnum = pgEnum('role', ['admin', 'user', 'guest']);

// Use in table
const users = pgTable('users', {
  id: serial().primaryKey(),
  status: statusEnum().default('pending'),
  role: roleEnum().notNull(),
});
```

## Sequences

Standalone sequences for custom ID generation:

```typescript
import { pgSequence, pgSchema } from 'drizzle-orm/pg-core';

// Basic sequence
export const orderSeq = pgSequence('order_seq');

// Sequence with options
export const customSeq = pgSequence('custom_seq', {
  startWith: 100,
  maxValue: 10000,
  minValue: 100,
  cycle: true,
  cache: 10,
  increment: 2,
});

// Sequence in custom schema
export const mySchema = pgSchema('custom_schema');
export const schemaSeq = mySchema.sequence('name');
```

## Default Values

```typescript
const users = pgTable('users', {
  // Static default
  role: text().default('user'),
  isActive: boolean().default(true),
  
  // SQL expression default
  createdAt: timestamp().defaultNow(),
  id: uuid().defaultRandom(),
  
  // Dynamic default (evaluated at runtime)
  secretKey: text().$defaultFn(() => crypto.randomUUID()),
  
  // On update (for UPDATE operations)
  updatedAt: timestamp().$onUpdate(() => new Date()),
});
```

## Column Helpers Pattern

Create reusable timestamp columns:

```typescript
const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
};

const users = pgTable('users', {
  id: serial().primaryKey(),
  name: text(),
  ...timestamps,  // Spread common columns
});

const posts = pgTable('posts', {
  id: serial().primaryKey(),
  title: text(),
  ...timestamps,
});
```

## Complete Example

```typescript
import { 
  pgTable, pgEnum, pgSchema,
  serial, integer, text, varchar, boolean,
  timestamp, uuid, jsonb
} from 'drizzle-orm/pg-core';

// Custom schema
export const appSchema = pgSchema('app');

// Enums
export const userRole = pgEnum('user_role', ['admin', 'member', 'guest']);
export const postStatus = pgEnum('post_status', ['draft', 'published', 'archived']);

// Reusable columns
const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
};

// Users table
export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: text().notNull(),
  role: userRole().default('member'),
  settings: jsonb().$type<{ theme: string; lang: string }>(),
  isActive: boolean().default(true),
  ...timestamps,
});

// Posts table
export const posts = pgTable('posts', {
  id: serial().primaryKey(),
  title: text().notNull(),
  content: text(),
  authorId: uuid().references(() => users.id),
  status: postStatus().default('draft'),
  tags: text().array(),
  ...timestamps,
});

// Comments in custom schema
export const comments = appSchema.table('comments', {
  id: serial().primaryKey(),
  postId: integer().references(() => posts.id),
  authorId: uuid().references(() => users.id),
  content: text().notNull(),
  ...timestamps,
});
```

## Related References

- [drizzle-constraints.md](./drizzle-constraints.md) - Indexes and constraints
- [drizzle-relations.md](./drizzle-relations.md) - Table relationships
- [drizzle-kit.md](./drizzle-kit.md) - Migration CLI
