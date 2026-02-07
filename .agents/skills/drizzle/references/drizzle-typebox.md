# drizzle-typebox Reference

`drizzle-typebox` generates [TypeBox](https://github.com/sinclairzx81/typebox) schemas from Drizzle ORM schemas, enabling high-performance runtime validation with JSON Schema compatibility.

## Installation

```bash
npm i drizzle-typebox
# or
pnpm add drizzle-typebox
```

## Version Requirements

- **drizzle-typebox:** v0.2.0 or higher
- **Drizzle ORM:** v0.36.0 or greater
- **TypeBox:** v0.34.8 or greater

## Core Functions

### createSelectSchema

Generates a TypeBox schema matching data queried from database.

```typescript
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-typebox';
import { Value } from '@sinclair/typebox/value';

const users = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: text().notNull(),
  age: integer().notNull()
});

const userSelectSchema = createSelectSchema(users);

// Validate with Value.Parse (throws on error)
const parsed: { id: number; name: string; age: number } = Value.Parse(userSelectSchema, rows[0]);

// Or use Value.Check for boolean result
const isValid = Value.Check(userSelectSchema, data);
```

### createInsertSchema

Generates a TypeBox schema for INSERT validation.

```typescript
import { createInsertSchema } from 'drizzle-typebox';
import { Value } from '@sinclair/typebox/value';

const userInsertSchema = createInsertSchema(users);

// Type: { name: string; age: number }
const parsed = Value.Parse(userInsertSchema, user);
await db.insert(users).values(parsed);
```

### createUpdateSchema

Generates a TypeBox schema for UPDATE validation. All fields become optional.

```typescript
import { createUpdateSchema } from 'drizzle-typebox';
import { Value } from '@sinclair/typebox/value';

const userUpdateSchema = createUpdateSchema(users);

// Type: { name?: string | undefined; age?: number | undefined }
const parsed = Value.Parse(userUpdateSchema, { age: 35 });
await db.update(users).set(parsed).where(eq(users.name, 'Jane'));
```

## Views and Enums Support

```typescript
import { pgEnum, pgView } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-typebox';
import { Value } from '@sinclair/typebox/value';

// Enums
const roles = pgEnum('roles', ['admin', 'basic']);
const rolesSchema = createSelectSchema(roles);
const parsed: 'admin' | 'basic' = Value.Parse(rolesSchema, ...);

// Views
const usersView = pgView('users_view').as((qb) => 
  qb.select().from(users).where(gt(users.age, 18))
);
const usersViewSchema = createSelectSchema(usersView);
```

## Refinements

Extend, modify, or overwrite field schemas:

```typescript
import { createSelectSchema } from 'drizzle-typebox';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const users = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: text().notNull(),
  bio: text(),
  preferences: json()
});

const userSelectSchema = createSelectSchema(users, {
  // Callback: Extends schema (spread existing, add constraints)
  name: (schema) => Type.String({ ...schema, maxLength: 20 }),
  
  // Callback: Extends before nullable/optional applied
  bio: (schema) => Type.String({ ...schema, maxLength: 1000 }),
  
  // Direct schema: Completely overwrites (including nullability)
  preferences: Type.Object({ theme: Type.String() })
});

// Result type:
// {
//   id: number;
//   name: string;      // maxLength 20
//   bio?: string;      // maxLength 1000, optional
//   preferences: { theme: string };
// }
```

## Factory Functions

Use `createSchemaFactory` for advanced scenarios:

### Extended TypeBox Instance (Elysia)

```typescript
import { createSchemaFactory } from 'drizzle-typebox';
import { t } from 'elysia';  // Elysia's extended TypeBox

const { createInsertSchema } = createSchemaFactory({ typeboxInstance: t });

const userInsertSchema = createInsertSchema(users, {
  // Use Elysia's extended methods
  name: (schema) => t.Number({ ...schema }, { error: '`name` must be a string' })
});
```

## Data Type Mappings

### Primitives

| Drizzle Type | TypeBox Schema |
|--------------|----------------|
| `boolean()` | `Type.Boolean()` |
| `text()`, `varchar()` | `Type.String()` |
| `integer()`, `serial()` | `Type.Integer()` |
| `real()`, `doublePrecision()` | `Type.Number()` |
| `bigint({ mode: 'bigint' })` | `Type.BigInt()` |

### Dates

| Drizzle Type | TypeBox Schema |
|--------------|----------------|
| `date({ mode: 'date' })` | `Type.Date()` |
| `timestamp({ mode: 'date' })` | `Type.Date()` |
| `date({ mode: 'string' })` | `Type.String()` |
| `timestamp({ mode: 'string' })` | `Type.String()` |

### Constrained Types

| Drizzle Type | TypeBox Schema |
|--------------|----------------|
| `char({ length: 10 })` | `Type.String({ minLength: 10, maxLength: 10 })` |
| `varchar({ length: 255 })` | `Type.String({ maxLength: 255 })` |
| `uuid()` | `Type.String({ format: 'uuid' })` |
| `bit({ dimensions: 8 })` | `t.RegExp(/^[01]+$/, { maxLength: 8 })` |

### Numeric Ranges

| Drizzle Type | TypeBox Schema |
|--------------|----------------|
| `tinyint()` | `Type.Integer({ minimum: -128, maximum: 127 })` |
| `smallint()` | `Type.Integer({ minimum: -32768, maximum: 32767 })` |
| `integer()` | `Type.Integer({ minimum: -2147483648, maximum: 2147483647 })` |
| `bigint({ mode: 'number' })` | `Type.Integer({ minimum: -9007199254740991, maximum: 9007199254740991 })` |
| `bigint({ mode: 'bigint' })` | `Type.BigInt({ minimum: -9223372036854775808n, maximum: 9223372036854775807n })` |

### MySQL Text Types

| Drizzle Type | TypeBox Schema |
|--------------|----------------|
| `tinytext()` | `Type.String({ maxLength: 255 })` |
| `text()` | `Type.String({ maxLength: 65535 })` |
| `mediumtext()` | `Type.String({ maxLength: 16777215 })` |
| `longtext()` | `Type.String({ maxLength: 4294967295 })` |

### PostgreSQL Special

| Drizzle Type | TypeBox Schema |
|--------------|----------------|
| `enum(['a', 'b'])` | `Type.Enum(enum)` |
| `point({ mode: 'tuple' })` | `Type.Tuple([Type.Number(), Type.Number()])` |
| `point({ mode: 'xy' })` | `Type.Object({ x: Type.Number(), y: Type.Number() })` |
| `vector({ dimensions: 3 })` | `Type.Array(Type.Number(), { minItems: 3, maxItems: 3 })` |
| `line({ mode: 'abc' })` | `Type.Object({ a: Type.Number(), b: Type.Number(), c: Type.Number() })` |
| `line({ mode: 'tuple' })` | `Type.Tuple([Type.Number(), Type.Number(), Type.Number()])` |

### JSON Types

| Drizzle Type | TypeBox Schema |
|--------------|----------------|
| `json()`, `jsonb()` | `Type.Recursive((self) => Type.Union([Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]), Type.Array(self), Type.Record(Type.String(), self)]))` |

## Common Patterns

### API Validation

```typescript
import { createInsertSchema } from 'drizzle-typebox';
import { Value } from '@sinclair/typebox/value';

const userInsertSchema = createInsertSchema(users);

export async function POST(req: Request) {
  const body = await req.json();
  
  // Validate
  if (!Value.Check(userInsertSchema, body)) {
    const errors = [...Value.Errors(userInsertSchema, body)];
    return Response.json({ errors }, { status: 400 });
  }
  
  // Type-safe after validation
  await db.insert(users).values(body);
  return Response.json({ success: true });
}
```

### Elysia Framework Integration

```typescript
import { Elysia, t } from 'elysia';
import { createSchemaFactory } from 'drizzle-typebox';

const { createInsertSchema } = createSchemaFactory({ typeboxInstance: t });
const userInsertSchema = createInsertSchema(users);

const app = new Elysia()
  .post('/users', ({ body }) => {
    return db.insert(users).values(body);
  }, {
    body: userInsertSchema
  });
```

### JSON Schema Generation

TypeBox schemas are JSON Schema compatible:

```typescript
import { createSelectSchema } from 'drizzle-typebox';

const userSchema = createSelectSchema(users);

// userSchema IS a valid JSON Schema object
console.log(JSON.stringify(userSchema, null, 2));
// Can be used with any JSON Schema validator
```

### Fastify Integration

```typescript
import Fastify from 'fastify';
import { createInsertSchema } from 'drizzle-typebox';

const userInsertSchema = createInsertSchema(users);

const app = Fastify();

app.post('/users', {
  schema: {
    body: userInsertSchema  // JSON Schema compatible
  }
}, async (request) => {
  await db.insert(users).values(request.body);
});
```

## Validation Methods

TypeBox provides multiple validation approaches:

```typescript
import { Value } from '@sinclair/typebox/value';

// Parse: Returns value or throws
const parsed = Value.Parse(schema, data);

// Check: Returns boolean
const isValid = Value.Check(schema, data);

// Errors: Returns iterator of errors
const errors = [...Value.Errors(schema, data)];

// Clean: Remove unknown properties
const cleaned = Value.Clean(schema, data);

// Convert: Type coercion
const converted = Value.Convert(schema, data);

// Default: Apply default values
const withDefaults = Value.Default(schema, data);
```

## Nullability Behavior (From Source Code)

Understanding how the schema generators handle nullability:

### Select Schema
```typescript
const table = pgTable('test', {
  c1: integer(),              // → Type.Union([Type.Integer(...), Type.Null()])
  c2: integer().notNull(),    // → Type.Integer(...)
});
```

### Insert Schema
```typescript
const table = pgTable('test', {
  c1: integer(),                          // nullable → Type.Optional(Type.Union([...int, Type.Null()]))
  c2: integer().notNull(),                // required → Type.Integer(...)
  c3: integer().default(1),               // has default → Type.Optional(Type.Union([...int, Type.Null()]))
  c4: integer().notNull().default(1),     // notNull + default → Type.Optional(Type.Integer(...))
  c5: integer().generatedAlwaysAs(1),     // EXCLUDED from schema
  c6: integer().generatedAlwaysAsIdentity(), // EXCLUDED from schema
  c7: integer().generatedByDefaultAsIdentity(), // included as optional
});
```

### Update Schema
```typescript
// All non-generated columns become optional
const schema = createUpdateSchema(table);
// All fields are Type.Optional(...)
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

const insertSchema = createInsertSchema(table);
// { idOptional?: number }
```

## Custom JSON Types with $type<T>()

For complex JSON structures:

```typescript
import type { TopLevelCondition } from 'json-rules-engine';

const rules = pgTable('rules', {
  config: json().$type<TopLevelCondition>().notNull(),
});

// For custom TypeBox schema:
const ruleInsertSchema = createInsertSchema(rules, {
  config: Type.Object({
    conditions: Type.Object({
      all: Type.Optional(Type.Array(Type.Any())),
      any: Type.Optional(Type.Array(Type.Any())),
    }),
    event: Type.Object({
      type: Type.String(),
    }),
  }),
});
```

## Dialect-Specific Numeric Ranges

### PostgreSQL
```typescript
bigint({ mode: 'number' }) // Type.Integer({ minimum: -9007199254740991, maximum: 9007199254740991 })
bigint({ mode: 'bigint' }) // Type.BigInt({ minimum: -9223372036854775808n, maximum: 9223372036854775807n })
```

### MySQL/SingleStore
```typescript
// Unsigned modifier detected from SQL type
int()           // Type.Integer({ minimum: -2147483648, maximum: 2147483647 })
int().unsigned() // Type.Integer({ minimum: 0, maximum: 4294967295 })

// MySQL-specific types
tinyint()           // Type.Integer({ minimum: -128, maximum: 127 })
tinyint().unsigned() // Type.Integer({ minimum: 0, maximum: 255 })
year()              // Type.Integer({ minimum: 1901, maximum: 2155 })

// Serial in MySQL is unsigned bigint
serial() // Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER })
```

### SQLite
```typescript
integer() // Type.Integer({ minimum: Number.MIN_SAFE_INTEGER, maximum: Number.MAX_SAFE_INTEGER })
blob({ mode: 'bigint' }) // Type.BigInt({ minimum: -9223372036854775808n, maximum: 9223372036854775807n })
```

## Internal JSON Schema

The built-in JSON schema used for `json()` and `jsonb()` columns:

```typescript
// From drizzle-typebox/src/column.ts
export const literalSchema = t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]);
export const jsonSchema = t.Union([
  literalSchema,
  t.Array(t.Any()),
  t.Record(t.String(), t.Any())
]);
```

## Buffer Schema

For SQLite blob columns:

```typescript
// From drizzle-typebox/src/column.ts
// Uses TypeBox TypeRegistry for Buffer validation
TypeRegistry.Set('Buffer', (_, value) => value instanceof Buffer);
export const bufferSchema = t.Unsafe<Buffer>({ [Kind]: 'Buffer' });
```

## External Resources

- [Official Documentation](https://orm.drizzle.team/docs/typebox)
- [GitHub Repository](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-typebox)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Elysia Documentation](https://elysiajs.com/)
