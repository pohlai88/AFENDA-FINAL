# drizzle-zod Reference

`drizzle-zod` generates [Zod](https://github.com/colinhacks/zod) schemas from Drizzle ORM schemas, enabling type-safe runtime validation with full TypeScript inference.

## Installation

```bash
npm i drizzle-zod
# or
pnpm add drizzle-zod
```

## Version Requirements

- **drizzle-zod:** v0.6.0 or higher
- **Drizzle ORM:** v0.36.0 or greater
- **Zod:** v3.25.1 or greater

## Core Functions

### createSelectSchema

Generates a Zod schema matching data queried from database. Use for validating API responses.

```typescript
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

const users = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: text().notNull(),
  age: integer().notNull()
});

const userSelectSchema = createSelectSchema(users);

// Type: { id: number; name: string; age: number }
const parsed = userSelectSchema.parse(rows[0]);
```

### createInsertSchema

Generates a Zod schema for INSERT validation. Excludes generated/auto-increment columns.

```typescript
import { createInsertSchema } from 'drizzle-zod';

const userInsertSchema = createInsertSchema(users);

// Type: { name: string; age: number } - id is excluded (auto-generated)
const parsed = userInsertSchema.parse({ name: 'Jane', age: 30 });
await db.insert(users).values(parsed);
```

### createUpdateSchema

Generates a Zod schema for UPDATE validation. All fields become optional.

```typescript
import { createUpdateSchema } from 'drizzle-zod';

const userUpdateSchema = createUpdateSchema(users);

// Type: { name?: string | undefined; age?: number | undefined }
const parsed = userUpdateSchema.parse({ age: 35 });
await db.update(users).set(parsed).where(eq(users.name, 'Jane'));
```

## Views and Enums Support

```typescript
import { pgEnum, pgView } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

// Enums
const roles = pgEnum('roles', ['admin', 'basic']);
const rolesSchema = createSelectSchema(roles);
const parsed: 'admin' | 'basic' = rolesSchema.parse(...);

// Views
const usersView = pgView('users_view').as((qb) => 
  qb.select().from(users).where(gt(users.age, 18))
);
const usersViewSchema = createSelectSchema(usersView);
```

## Refinements

Extend, modify, or overwrite field schemas via the second parameter:

```typescript
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

const users = pgTable('users', {
  id: integer().primaryKey(),
  name: text().notNull(),
  bio: text(),
  preferences: json()
});

const userSelectSchema = createSelectSchema(users, {
  // Callback: Extends schema
  name: (schema) => schema.max(20),
  
  // Callback: Extends before nullable/optional applied
  bio: (schema) => schema.max(1000),
  
  // Direct schema: Completely overwrites (including nullability)
  preferences: z.object({ theme: z.string() })
});

// Result type:
// {
//   id: number;
//   name: string;      // max 20 chars
//   bio?: string;      // max 1000 chars, optional
//   preferences: { theme: string };  // no longer nullable
// }
```

## Factory Functions

Use `createSchemaFactory` for advanced scenarios:

### Extended Zod Instance

```typescript
import { createSchemaFactory } from 'drizzle-zod';
import { z } from '@hono/zod-openapi';

const { createInsertSchema } = createSchemaFactory({ zodInstance: z });

const userInsertSchema = createInsertSchema(users, {
  name: (schema) => schema.openapi({ example: 'John' })
});
```

### Type Coercion

```typescript
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';

const users = pgTable('users', {
  createdAt: timestamp().notNull()
});

const { createInsertSchema } = createSchemaFactory({
  coerce: { date: true }  // Coerce date strings to Date objects
});

const userInsertSchema = createInsertSchema(users);
// createdAt field will use z.coerce.date()
```

Full coercion options:
```typescript
const { createInsertSchema } = createSchemaFactory({
  coerce: true  // Coerce all data types
  // or specify individual types:
  // coerce: { date: true, number: true, boolean: true }
});
```

## Data Type Mappings

### Primitives

| Drizzle Type | Zod Schema |
|--------------|------------|
| `boolean()` | `z.boolean()` |
| `text()`, `varchar()` | `z.string()` |
| `integer()`, `serial()` | `z.number().int()` |
| `real()`, `doublePrecision()` | `z.number()` |
| `bigint({ mode: 'bigint' })` | `z.bigint()` |
| `json()`, `jsonb()` | `z.union([z.string(), z.number(), z.boolean(), z.null(), z.record(z.any()), z.array(z.any())])` |

### Dates

| Drizzle Type | Zod Schema |
|--------------|------------|
| `date({ mode: 'date' })` | `z.date()` |
| `timestamp({ mode: 'date' })` | `z.date()` |
| `date({ mode: 'string' })` | `z.string()` |
| `timestamp({ mode: 'string' })` | `z.string()` |

### Constrained Types

| Drizzle Type | Zod Schema |
|--------------|------------|
| `char({ length: 10 })` | `z.string().length(10)` |
| `varchar({ length: 255 })` | `z.string().max(255)` |
| `uuid()` | `z.string().uuid()` |
| `bit({ dimensions: 8 })` | `z.string().regex(/^[01]+$/).max(8)` |

### Numeric Ranges

| Drizzle Type | Zod Schema |
|--------------|------------|
| `smallint()` | `z.number().min(-32768).max(32767).int()` |
| `integer()` | `z.number().min(-2147483648).max(2147483647).int()` |
| `bigint({ mode: 'number' })` | `z.number().min(-9007199254740991).max(9007199254740991).int()` |

### PostgreSQL Special

| Drizzle Type | Zod Schema |
|--------------|------------|
| `enum(['a', 'b'])` | `z.enum(['a', 'b'])` |
| `point({ mode: 'tuple' })` | `z.tuple([z.number(), z.number()])` |
| `point({ mode: 'xy' })` | `z.object({ x: z.number(), y: z.number() })` |
| `vector({ dimensions: 3 })` | `z.array(z.number()).length(3)` |
| `dataType().array()` | `z.array(baseSchema)` |

## Common Patterns

### API Request Validation

```typescript
import { createInsertSchema } from 'drizzle-zod';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Validate request body
  const result = userInsertSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }
  
  // Insert validated data
  await db.insert(users).values(result.data);
  return Response.json({ success: true });
}
```

### react-hook-form Integration

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createInsertSchema } from 'drizzle-zod';

const userInsertSchema = createInsertSchema(users);
type UserInput = z.infer<typeof userInsertSchema>;

function UserForm() {
  const form = useForm<UserInput>({
    resolver: zodResolver(userInsertSchema)
  });
  // ...
}
```

### Hono OpenAPI

```typescript
import { createSchemaFactory } from 'drizzle-zod';
import { z } from '@hono/zod-openapi';

const { createInsertSchema } = createSchemaFactory({ zodInstance: z });

const userSchema = createInsertSchema(users, {
  name: (schema) => schema.openapi({ example: 'John Doe' }),
  email: (schema) => schema.openapi({ example: 'john@example.com' })
});
```

### Partial Updates

```typescript
const userUpdateSchema = createUpdateSchema(users);

// PATCH endpoint - all fields optional
export async function PATCH(req: Request) {
  const body = await req.json();
  const parsed = userUpdateSchema.parse(body);
  
  await db.update(users)
    .set(parsed)
    .where(eq(users.id, body.id));
}
```

## Nullability Behavior (From Source Code)

Understanding how the schema generators handle nullability:

### Select Schema
```typescript
// All columns except generated always return their value:
// - notNull columns → required, non-nullable
// - nullable columns → required, but nullable (with .or(z.null()))
const table = pgTable('test', {
  c1: integer(),              // → z.number().int() | z.null()
  c2: integer().notNull(),    // → z.number().int()
});
```

### Insert Schema
```typescript
const table = pgTable('test', {
  c1: integer(),                          // nullable → optional, nullable
  c2: integer().notNull(),                // required → required, non-nullable
  c3: integer().default(1),               // has default → optional, nullable
  c4: integer().notNull().default(1),     // notNull + default → optional, non-nullable
  c5: integer().generatedAlwaysAs(1),     // EXCLUDED from schema
  c6: integer().generatedAlwaysAsIdentity(), // EXCLUDED from schema
  c7: integer().generatedByDefaultAsIdentity(), // included as optional
});

const schema = createInsertSchema(table);
// Result:
// {
//   c1?: number | null,
//   c2: number,
//   c3?: number | null,
//   c4?: number,
//   c7?: number,
// }
```

### Update Schema
```typescript
// All non-generated columns become optional
const schema = createUpdateSchema(table);
// Result:
// {
//   c1?: number | null,
//   c2?: number,
//   c3?: number | null,
//   c4?: number,
//   c7?: number,
// }
```

## Generated Columns

Generated columns are handled differently based on type:

```typescript
const table = pgTable('test', {
  // Computed column - ALWAYS excluded from insert/update
  computed: integer().generatedAlwaysAs(sql`other_col * 2`),
  
  // Identity (always) - ALWAYS excluded from insert/update
  id: integer().generatedAlwaysAsIdentity(),
  
  // Identity (by default) - INCLUDED as optional in insert
  idOptional: integer().generatedByDefaultAsIdentity(),
});

// Insert schema excludes computed and id, includes idOptional as optional
const insertSchema = createInsertSchema(table);
// { idOptional?: number }

// Select schema includes all
const selectSchema = createSelectSchema(table);
// { computed: number; id: number; idOptional: number }
```

## Custom JSON Types with $type<T>()

For complex JSON structures, use `$type<T>()` to specify the TypeScript type:

```typescript
import type { TopLevelCondition } from 'json-rules-engine';

const rules = pgTable('rules', {
  id: serial().primaryKey(),
  config: json().$type<TopLevelCondition>().notNull(),
  metadata: jsonb().$type<{ version: number; tags: string[] }>(),
});

// The generated schema will infer the custom type
const ruleSelectSchema = createSelectSchema(rules);
// config: TopLevelCondition
// metadata: { version: number; tags: string[] } | null

// For validation, you may want to create a custom schema:
const ruleInsertSchema = createInsertSchema(rules, {
  config: z.custom<TopLevelCondition>((val) => {
    // Custom validation logic
    return typeof val === 'object' && val !== null;
  }),
});
```

## Dialect-Specific Numeric Ranges

### PostgreSQL
```typescript
// bigint with number mode uses safe integer range
bigint({ mode: 'number' }) // z.number().min(-9007199254740991).max(9007199254740991).int()

// bigint with bigint mode uses actual bigint range
bigint({ mode: 'bigint' }) // z.bigint().gte(-9223372036854775808n).lte(9223372036854775807n)

// serial types
serial()       // z.number().int() (min implicit from DB)
smallserial()  // z.number().min(-32768).max(32767).int()
bigserial({ mode: 'number' }) // z.number().min(-9007199254740991).max(9007199254740991).int()
```

### MySQL/SingleStore
```typescript
// Unsigned modifier detected from SQL type
int()           // z.number().min(-2147483648).max(2147483647).int()
int().unsigned() // z.number().min(0).max(4294967295).int()

// MySQL-specific types
tinyint()           // z.number().min(-128).max(127).int()
tinyint().unsigned() // z.number().min(0).max(255).int()
mediumint()         // z.number().min(-8388608).max(8388607).int()
year()              // z.number().min(1901).max(2155).int()

// Serial in MySQL is unsigned bigint
serial() // z.number().min(0).max(Number.MAX_SAFE_INTEGER).int()
```

### SQLite
```typescript
// SQLite integer uses safe integer range (stored as 64-bit)
integer() // z.number().min(-9007199254740991).max(9007199254740991).int()

// Blob modes
blob({ mode: 'bigint' }) // z.bigint().gte(-9223372036854775808n).lte(9223372036854775807n)
blob({ mode: 'json' })   // jsonSchema (union type)
```

## Internal JSON Schema

The built-in JSON schema used for `json()` and `jsonb()` columns:

```typescript
// From drizzle-zod/src/column.ts
export const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const jsonSchema = z.union([
  literalSchema,
  z.record(z.string(), z.any()),
  z.array(z.any()),
]);
```

## External Resources

- [Official Documentation](https://orm.drizzle.team/docs/zod)
- [GitHub Repository](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-zod)
- [Zod Documentation](https://zod.dev/)
