```skill
---
name: drizzle
description: Comprehensive Drizzle ORM skill covering schema declaration, relations, queries, constraints, RLS, CLI migrations, and validation library integrations (Zod, TypeBox, Valibot, ArkType). Use for PostgreSQL/MySQL/SQLite schema design, database migrations, row-level security with Neon/Supabase, and schema validation.
---

# Drizzle ORM Comprehensive Guide

Drizzle ORM is a TypeScript-first SQL ORM with maximum type safety, SQL-like syntax, and zero runtime overhead.

## Quick Reference Table

| Topic | Reference | When to Use |
|-------|-----------|-------------|
| **Core ORM** |||
| Schema Declaration | [drizzle-schema.md](references/drizzle-schema.md) | Tables, columns, types, pgSchema, sequences |
| Relations | [drizzle-relations.md](references/drizzle-relations.md) | defineRelations, one/many, many-to-many, normalization |
| Queries | [drizzle-queries.md](references/drizzle-queries.md) | SQL-like, Relational Queries, joins, where, aggregations |
| Constraints | [drizzle-constraints.md](references/drizzle-constraints.md) | Indexes, PK, FK, unique, check constraints |
| **Security** |||
| Row Level Security | [drizzle-rls.md](references/drizzle-rls.md) | RLS policies, Neon/Supabase integration, roles |
| **Extensions** |||
| PostgreSQL Extensions | [drizzle-extensions.md](references/drizzle-extensions.md) | pgvector, PostGIS, vector search |
| **Tooling** |||
| Drizzle Kit CLI | [drizzle-kit.md](references/drizzle-kit.md) | Migrations: generate, migrate, push, pull, studio |
| **Validation** |||
| Zod Integration | [drizzle-zod.md](references/drizzle-zod.md) | Form validation, tRPC, react-hook-form |
| TypeBox Integration | [drizzle-typebox.md](references/drizzle-typebox.md) | Elysia, JSON Schema, high-performance |
| Valibot Integration | [drizzle-valibot.md](references/drizzle-valibot.md) | Small bundle size, tree-shaking |
| ArkType Integration | [drizzle-arktype.md](references/drizzle-arktype.md) | Advanced type inference, expressive syntax |
| **API Generation** |||
| GraphQL | [drizzle-graphql.md](references/drizzle-graphql.md) | Auto-generate GraphQL from tables |
| **Internals** |||
| Numeric Constants | [drizzle-constants.md](references/drizzle-constants.md) | Integer limits, type ranges |

---

## Installation

```bash
# Core ORM
npm i drizzle-orm
npm i -D drizzle-kit

# Database Drivers
npm i @neondatabase/serverless  # Neon
npm i postgres                   # node-postgres / pg
npm i better-sqlite3             # SQLite
npm i mysql2                     # MySQL
```

---

## Essential Patterns

### 1. Schema Declaration

```typescript
import { pgTable, serial, text, integer, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

// Reusable timestamp columns
const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
};

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text().notNull(),
  isActive: boolean().default(true),
  ...timestamps,
});

export const posts = pgTable('posts', {
  id: serial().primaryKey(),
  title: text().notNull(),
  content: text(),
  authorId: uuid().references(() => users.id),
  ...timestamps,
});
```

### 2. Relations (v2 API)

```typescript
import { defineRelations } from 'drizzle-orm';

export const relations = defineRelations({ users, posts }, (r) => ({
  users: {
    posts: r.many.posts(),
  },
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
}));
```

### 3. Database Connection

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { relations } from './relations';

const db = drizzle(process.env.DATABASE_URL!, { 
  schema,
  relations,
});
```

### 4. Queries

```typescript
import { eq } from 'drizzle-orm';

// SQL-like
const activeUsers = await db.select().from(users).where(eq(users.isActive, true));

// Relational (with nested data)
const postsWithAuthor = await db.query.posts.findMany({
  with: { author: true },
  where: eq(posts.status, 'published'),
});
```

### 5. Validation with Zod

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

const insertUserSchema = createInsertSchema(users, {
  email: (s) => s.email(),
  name: (s) => s.min(2).max(100),
});

// Validate request body
const validUser = insertUserSchema.parse(requestBody);
await db.insert(users).values(validUser);
```

---

## Migration Workflows

### Development (push - no migration files)

```bash
npx drizzle-kit push
```

### Production (generate + migrate)

```bash
# Generate SQL migration
npx drizzle-kit generate --name=add_users

# Apply migration
npx drizzle-kit migrate
```

### Database-First (pull)

```bash
npx drizzle-kit pull
```

### Launch Studio GUI

```bash
npx drizzle-kit studio
```

---

## RLS with Neon

```typescript
import { crudPolicy, authenticatedRole, authUid } from 'drizzle-orm/neon';

export const posts = pgTable('posts', {
  id: serial().primaryKey(),
  authorId: uuid().notNull(),
  content: text(),
}, (t) => [
  crudPolicy({
    role: authenticatedRole,
    read: true,
    modify: authUid(t.authorId),  // Only author can modify
  }),
]);
```

---

## Validation Library Decision Tree

| Need | Recommendation |
|------|----------------|
| react-hook-form / tRPC | drizzle-zod |
| Elysia framework | drizzle-typebox |
| Smallest bundle | drizzle-valibot |
| Advanced TypeScript | drizzle-arktype |
| JSON Schema | drizzle-typebox |
| GraphQL API | drizzle-graphql |

---

## Configuration (drizzle.config.ts)

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // For Neon RLS
  entities: {
    roles: {
      provider: 'neon',
    },
  },
});
```

---

## Internal Architecture

### Schema Generator Conditions

All drizzle-* validation plugins use the same conditions system:

```typescript
// Select Schema: All columns, nullable based on notNull
selectConditions = {
  never: () => false,                    // Include all
  optional: () => false,                 // All required
  nullable: (col) => !col.notNull,       // Nullable if not notNull
}

// Insert Schema: Excludes generated, optional for nullable/defaults  
insertConditions = {
  never: (col) => col.generated?.type === 'always',  // Exclude always-generated
  optional: (col) => !col.notNull || col.hasDefault, // Optional if nullable/default
  nullable: (col) => !col.notNull,
}

// Update Schema: All fields optional
updateConditions = {
  never: (col) => col.generated?.type === 'always',
  optional: () => true,                  // All optional
  nullable: (col) => !col.notNull,
}
```

### Generated Column Handling

```typescript
// EXCLUDED from insert/update schemas:
id: integer().generatedAlwaysAs(sql`...`)
id: integer().generatedAlwaysAsIdentity()

// INCLUDED as optional:
code: integer().generatedByDefaultAsIdentity()  // Can override
```

### Numeric Constants

Integer ranges used across all validation plugins:

| Type | Min | Max |
|------|-----|-----|
| INT8 (tinyint) | -128 | 127 |
| INT16 (smallint) | -32768 | 32767 |
| INT32 (integer) | -2147483648 | 2147483647 |
| INT64 (bigint) | -9223372036854775808n | 9223372036854775807n |

---

## Dialect-Specific Features

| Feature | PostgreSQL | MySQL | SQLite |
|---------|------------|-------|--------|
| Identity columns | ✅ | ❌ | ❌ |
| Array types | ✅ | ❌ | ❌ |
| pgSchema | ✅ | ❌ | ❌ |
| pgEnum | ✅ | ❌ | ❌ |
| RLS | ✅ | ❌ | ❌ |
| pgvector | ✅ | ❌ | ❌ |
| unsigned int | ❌ | ✅ | ❌ |

---

## Best Practices

1. **Use Identity Columns** over serial for new tables
2. **Index Foreign Keys** for join performance
3. **Use Relational Queries** for nested data (simpler, optimized)
4. **Use SQL-like Queries** for complex joins/aggregations
5. **Enable RLS** for multi-tenant security
6. **Validate inputs** with drizzle-zod before insert/update
7. **Use drizzle-kit push** for development, **generate+migrate** for production

---

## Fetching Documentation

Always reference official docs:

```bash
# Fetch any Drizzle doc page
curl -H "Accept: text/markdown" https://orm.drizzle.team/docs/<path>
```

Common paths:
- `/docs/sql-schema-declaration`
- `/docs/relations-v2`
- `/docs/data-querying`
- `/docs/rls`
- `/docs/kit-overview`
- `/docs/drizzle-config-file`
```
