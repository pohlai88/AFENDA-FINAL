# Drizzle Constraints & Indexes

Complete reference for indexes and constraints in Drizzle ORM.

## Constraints

### NOT NULL

```typescript
const users = pgTable('users', {
  name: text().notNull(),
  email: text().notNull(),
  bio: text(),  // nullable by default
});
```

### DEFAULT Values

```typescript
import { sql } from 'drizzle-orm';

const users = pgTable('users', {
  // Static default
  role: text().default('user'),
  isActive: boolean().default(true),
  
  // SQL expression default
  createdAt: timestamp().defaultNow(),
  id: uuid().defaultRandom(),
  
  // Dynamic default (runtime)
  token: text().$defaultFn(() => crypto.randomUUID()),
  
  // Update trigger
  updatedAt: timestamp().$onUpdate(() => new Date()),
});
```

### PRIMARY KEY

Single column primary key:

```typescript
const users = pgTable('users', {
  id: serial().primaryKey(),
  // or
  id: uuid().primaryKey().defaultRandom(),
});
```

Composite primary key:

```typescript
import { primaryKey } from 'drizzle-orm/pg-core';

const userRoles = pgTable('user_roles', {
  userId: integer().notNull(),
  roleId: integer().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.roleId] }),
]);

// Named composite primary key
const orderItems = pgTable('order_items', {
  orderId: integer().notNull(),
  productId: integer().notNull(),
}, (table) => [
  primaryKey({ 
    name: 'order_items_pk',
    columns: [table.orderId, table.productId] 
  }),
]);
```

### UNIQUE

Single column unique:

```typescript
const users = pgTable('users', {
  email: text().unique(),
  // or with name
  email: text().unique('users_email_unique'),
});
```

Composite unique:

```typescript
import { unique } from 'drizzle-orm/pg-core';

const users = pgTable('users', {
  tenantId: integer().notNull(),
  email: text().notNull(),
}, (table) => [
  unique().on(table.tenantId, table.email),
  // or named
  unique('tenant_email_unique').on(table.tenantId, table.email),
]);
```

PostgreSQL NULLS NOT DISTINCT (treats NULL as equal):

```typescript
const users = pgTable('users', {
  tenantId: integer(),
  email: text(),
}, (table) => [
  unique().on(table.tenantId, table.email).nullsNotDistinct(),
]);
```

### CHECK Constraint

```typescript
import { check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const users = pgTable('users', {
  age: integer(),
  startDate: date(),
  endDate: date(),
}, (table) => [
  check('age_check', sql`${table.age} >= 0`),
  check('date_range_check', sql`${table.startDate} < ${table.endDate}`),
]);
```

### FOREIGN KEY

Inline foreign key:

```typescript
const posts = pgTable('posts', {
  id: serial().primaryKey(),
  authorId: integer().references(() => users.id),
});

// With onDelete/onUpdate actions
const posts = pgTable('posts', {
  authorId: integer().references(() => users.id, { onDelete: 'cascade' }),
});
```

Explicit foreign key (for composite keys or custom naming):

```typescript
import { foreignKey } from 'drizzle-orm/pg-core';

const orderItems = pgTable('order_items', {
  orderId: integer().notNull(),
  productId: integer().notNull(),
}, (table) => [
  foreignKey({
    name: 'order_items_order_fk',
    columns: [table.orderId],
    foreignColumns: [orders.id],
  }).onDelete('cascade').onUpdate('cascade'),
]);
```

Self-referencing foreign key:

```typescript
const categories = pgTable('categories', {
  id: serial().primaryKey(),
  name: text().notNull(),
  parentId: integer(),
}, (table) => [
  foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],  // Self-reference
    name: 'category_parent_fk',
  }).onDelete('set null'),
]);
```

Foreign key actions:

| Action | Description |
|--------|-------------|
| `cascade` | Delete/update child rows |
| `restrict` | Prevent delete/update if children exist |
| `no action` | Like restrict but deferred |
| `set null` | Set FK column to NULL |
| `set default` | Set FK column to default value |

## Indexes

### Basic Index

```typescript
import { index } from 'drizzle-orm/pg-core';

const users = pgTable('users', {
  email: text().notNull(),
  name: text(),
}, (table) => [
  index('users_email_idx').on(table.email),
]);
```

### Unique Index

```typescript
import { uniqueIndex } from 'drizzle-orm/pg-core';

const users = pgTable('users', {
  email: text().notNull(),
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
]);
```

### Composite Index

```typescript
const users = pgTable('users', {
  firstName: text(),
  lastName: text(),
}, (table) => [
  index('users_name_idx').on(table.firstName, table.lastName),
]);
```

### Index Methods (PostgreSQL)

```typescript
// B-tree (default) - equality and range queries
index('idx').on(table.column)

// Hash - equality only
index('idx').using('hash', table.column)

// GIN - arrays, jsonb, full-text search
index('idx').using('gin', table.tags)

// GiST - geometric, full-text, range types
index('idx').using('gist', table.location)

// BRIN - large sequential data
index('idx').using('brin', table.createdAt)
```

### Partial Index (WHERE)

Index only rows matching condition:

```typescript
const users = pgTable('users', {
  email: text(),
  status: text(),
}, (table) => [
  index('active_users_email_idx')
    .on(table.email)
    .where(sql`${table.status} = 'active'`),
]);
```

### Expression Index

Index on computed expression:

```typescript
const users = pgTable('users', {
  email: text(),
}, (table) => [
  index('users_email_lower_idx')
    .on(sql`lower(${table.email})`),
]);
```

### Concurrent Index Creation

Create index without blocking writes:

```typescript
const users = pgTable('users', {
  email: text(),
}, (table) => [
  index('users_email_idx')
    .on(table.email)
    .concurrently(),
]);
```

### Index Options

```typescript
const users = pgTable('users', {
  name: text(),
}, (table) => [
  index('users_name_idx')
    .on(table.name)
    .using('btree')
    .concurrently()
    .where(sql`${table.name} IS NOT NULL`)
    .with({ fillfactor: 70 }),
]);
```

### pgvector Indexes

For vector similarity search:

```typescript
import { vector } from 'drizzle-orm/pg-core';

const items = pgTable('items', {
  embedding: vector({ dimensions: 384 }),
}, (table) => [
  // L2 distance
  index('embedding_l2_idx')
    .using('hnsw', table.embedding.op('vector_l2_ops')),
  
  // Cosine distance
  index('embedding_cosine_idx')
    .using('hnsw', table.embedding.op('vector_cosine_ops')),
  
  // Inner product
  index('embedding_ip_idx')
    .using('hnsw', table.embedding.op('vector_ip_ops')),
]);
```

## Performance Index Patterns

### Foreign Key Indexes

Always index foreign key columns:

```typescript
const posts = pgTable('posts', {
  id: serial().primaryKey(),
  authorId: integer().references(() => users.id),
}, (table) => [
  index('posts_author_id_idx').on(table.authorId),
]);
```

### Many-to-Many Junction Tables

```typescript
const usersToGroups = pgTable('users_to_groups', {
  userId: integer().notNull().references(() => users.id),
  groupId: integer().notNull().references(() => groups.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.groupId] }),
  // Individual indexes for each side
  index('users_to_groups_user_id_idx').on(t.userId),
  index('users_to_groups_group_id_idx').on(t.groupId),
]);
```

### Covering Index (Include)

Include columns in index for index-only scans:

```typescript
// PostgreSQL 11+
index('users_email_covering_idx')
  .on(table.email)
  .include(table.name, table.createdAt)
```

### Multi-Tenant Indexes

For tenant-scoped queries:

```typescript
const data = pgTable('data', {
  tenantId: integer().notNull(),
  type: text().notNull(),
  createdAt: timestamp().notNull(),
}, (table) => [
  // Most queries filter by tenant first
  index('data_tenant_type_idx').on(table.tenantId, table.type),
  index('data_tenant_created_idx').on(table.tenantId, table.createdAt),
]);
```

## Complete Example

```typescript
import { 
  pgTable, serial, integer, text, timestamp, uuid, 
  index, uniqueIndex, foreignKey, primaryKey, check, unique 
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull(),
  name: text().notNull(),
  age: integer(),
  status: text().default('active'),
  createdAt: timestamp().defaultNow(),
}, (table) => [
  // Unique email
  uniqueIndex('users_email_idx').on(table.email),
  // Index for status queries
  index('users_status_idx')
    .on(table.status)
    .where(sql`${table.status} = 'active'`),
  // Age constraint
  check('users_age_check', sql`${table.age} >= 0`),
]);

export const posts = pgTable('posts', {
  id: serial().primaryKey(),
  title: text().notNull(),
  authorId: uuid().notNull(),
  status: text().default('draft'),
  publishedAt: timestamp(),
  createdAt: timestamp().defaultNow(),
}, (table) => [
  // Foreign key
  foreignKey({
    columns: [table.authorId],
    foreignColumns: [users.id],
    name: 'posts_author_fk',
  }).onDelete('cascade'),
  // Index on FK
  index('posts_author_id_idx').on(table.authorId),
  // Composite index
  index('posts_author_status_idx').on(table.authorId, table.status),
]);

export const tags = pgTable('tags', {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
});

export const postTags = pgTable('post_tags', {
  postId: integer().notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer().notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
  index('post_tags_tag_id_idx').on(table.tagId),
]);
```

## Related References

- [drizzle-schema.md](./drizzle-schema.md) - Column types and table declaration
- [drizzle-relations.md](./drizzle-relations.md) - Soft relations API
- [drizzle-rls.md](./drizzle-rls.md) - Row Level Security
