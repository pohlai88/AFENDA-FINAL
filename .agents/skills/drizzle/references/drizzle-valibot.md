# drizzle-valibot Reference

`drizzle-valibot` generates [Valibot](https://valibot.dev/) schemas from Drizzle ORM schemas, enabling modular, tree-shakeable runtime validation with minimal bundle size.

## Installation

```bash
npm i drizzle-valibot
# or
pnpm add drizzle-valibot
```

## Version Requirements

- **drizzle-valibot:** v0.3.0 or higher
- **Drizzle ORM:** v0.36.0 or greater
- **Valibot:** v1.0.0-beta.7 or greater

## Core Functions

### createSelectSchema

Generates a Valibot schema matching data queried from database.

```typescript
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-valibot';
import { parse } from 'valibot';

const users = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: text().notNull(),
  age: integer().notNull()
});

const userSelectSchema = createSelectSchema(users);

// Validate with parse (throws on error)
const parsed: { id: number; name: string; age: number } = parse(userSelectSchema, rows[0]);
```

### createInsertSchema

Generates a Valibot schema for INSERT validation.

```typescript
import { createInsertSchema } from 'drizzle-valibot';
import { parse } from 'valibot';

const userInsertSchema = createInsertSchema(users);

// Type: { name: string; age: number }
const parsed = parse(userInsertSchema, { name: 'Jane', age: 30 });
await db.insert(users).values(parsed);
```

### createUpdateSchema

Generates a Valibot schema for UPDATE validation. All fields become optional.

```typescript
import { createUpdateSchema } from 'drizzle-valibot';
import { parse } from 'valibot';

const userUpdateSchema = createUpdateSchema(users);

// Type: { name?: string | undefined; age?: number | undefined }
const parsed = parse(userUpdateSchema, { age: 35 });
await db.update(users).set(parsed).where(eq(users.name, 'Jane'));
```

## Views and Enums Support

```typescript
import { pgEnum, pgView } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-valibot';
import { parse } from 'valibot';

// Enums
const roles = pgEnum('roles', ['admin', 'basic']);
const rolesSchema = createSelectSchema(roles);
const parsed: 'admin' | 'basic' = parse(rolesSchema, ...);

// Views
const usersView = pgView('users_view').as((qb) => 
  qb.select().from(users).where(gt(users.age, 18))
);
const usersViewSchema = createSelectSchema(usersView);
```

## Refinements

Extend, modify, or overwrite field schemas using Valibot's pipe-based API:

```typescript
import { createSelectSchema } from 'drizzle-valibot';
import { parse, pipe, maxLength, object, string } from 'valibot';

const users = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: text().notNull(),
  bio: text(),
  preferences: json()
});

const userSelectSchema = createSelectSchema(users, {
  // Callback with pipe: Extends schema
  name: (schema) => pipe(schema, maxLength(20)),
  
  // Callback: Extends before nullable/optional applied
  bio: (schema) => pipe(schema, maxLength(1000)),
  
  // Direct schema: Completely overwrites (including nullability)
  preferences: object({ theme: string() })
});

// Result type:
// {
//   id: number;
//   name: string;      // maxLength 20
//   bio?: string;      // maxLength 1000, optional
//   preferences: { theme: string };
// }
```

## Data Type Mappings

### Primitives

| Drizzle Type | Valibot Schema |
|--------------|----------------|
| `boolean()` | `boolean()` |
| `text()`, `varchar()` | `string()` |
| `integer()`, `serial()` | `pipe(number(), integer())` |
| `real()`, `doublePrecision()` | `number()` |
| `bigint({ mode: 'bigint' })` | `bigint()` |

### Dates

| Drizzle Type | Valibot Schema |
|--------------|----------------|
| `date({ mode: 'date' })` | `date()` |
| `timestamp({ mode: 'date' })` | `date()` |
| `date({ mode: 'string' })` | `string()` |
| `timestamp({ mode: 'string' })` | `string()` |

### Constrained Types

| Drizzle Type | Valibot Schema |
|--------------|----------------|
| `char({ length: 10 })` | `pipe(string(), length(10))` |
| `varchar({ length: 255 })` | `pipe(string(), maxLength(255))` |
| `uuid()` | `pipe(string(), uuid())` |
| `bit({ dimensions: 8 })` | `pipe(string(), regex(/^[01]+$/), maxLength(8))` |

### Numeric Ranges

| Drizzle Type | Valibot Schema |
|--------------|----------------|
| `tinyint()` | `pipe(number(), minValue(-128), maxValue(127), integer())` |
| `smallint()` | `pipe(number(), minValue(-32768), maxValue(32767), integer())` |
| `integer()` | `pipe(number(), minValue(-2147483648), maxValue(2147483647), integer())` |
| `bigint({ mode: 'number' })` | `pipe(number(), minValue(-9007199254740991), maxValue(9007199254740991), integer())` |
| `bigint({ mode: 'bigint' })` | `pipe(bigint(), minValue(-9223372036854775808n), maxValue(9223372036854775807n))` |

### MySQL Text Types

| Drizzle Type | Valibot Schema |
|--------------|----------------|
| `tinytext()` | `pipe(string(), maxLength(255))` |
| `text()` | `pipe(string(), maxLength(65535))` |
| `mediumtext()` | `pipe(string(), maxLength(16777215))` |
| `longtext()` | `pipe(string(), maxLength(4294967295))` |

### PostgreSQL Special

| Drizzle Type | Valibot Schema |
|--------------|----------------|
| `enum(['a', 'b'])` | `enum(enum)` |
| `point({ mode: 'tuple' })` | `tuple([number(), number()])` |
| `point({ mode: 'xy' })` | `object({ x: number(), y: number() })` |
| `vector({ dimensions: 3 })` | `pipe(array(number()), length(3))` |
| `line({ mode: 'abc' })` | `object({ a: number(), b: number(), c: number() })` |
| `line({ mode: 'tuple' })` | `tuple([number(), number(), number()])` |

### JSON Types

| Drizzle Type | Valibot Schema |
|--------------|----------------|
| `json()`, `jsonb()` | `union([union([string(), number(), boolean(), null_()]), array(any()), record(string(), any())])` |

### Buffer Types

| Drizzle Type | Valibot Schema |
|--------------|----------------|
| `blob({ mode: 'buffer' })` | `custom<Buffer>((v) => v instanceof Buffer)` |

### Array Types

| Drizzle Type | Valibot Schema |
|--------------|----------------|
| `dataType().array(size)` | `pipe(array(baseDataTypeSchema), length(size))` |

## Common Patterns

### API Request Validation

```typescript
import { createInsertSchema } from 'drizzle-valibot';
import { parse, safeParse, flatten } from 'valibot';

const userInsertSchema = createInsertSchema(users);

export async function POST(req: Request) {
  const body = await req.json();
  
  // Safe validation (doesn't throw)
  const result = safeParse(userInsertSchema, body);
  if (!result.success) {
    return Response.json({ 
      errors: flatten(result.issues) 
    }, { status: 400 });
  }
  
  // Type-safe after validation
  await db.insert(users).values(result.output);
  return Response.json({ success: true });
}
```

### With Custom Error Messages

```typescript
import { createInsertSchema } from 'drizzle-valibot';
import { pipe, string, minLength, maxLength } from 'valibot';

const userInsertSchema = createInsertSchema(users, {
  name: (schema) => pipe(
    schema,
    minLength(2, 'Name must be at least 2 characters'),
    maxLength(100, 'Name must be at most 100 characters')
  )
});
```

### Form Validation

```typescript
import { createInsertSchema } from 'drizzle-valibot';
import { parse, safeParse, ValiError } from 'valibot';

const userInsertSchema = createInsertSchema(users);

function validateForm(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const result = safeParse(userInsertSchema, data);
  if (!result.success) {
    // Convert to field errors
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.issues) {
      const path = issue.path?.[0]?.key as string;
      if (path) {
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      }
    }
    return { success: false, errors: fieldErrors };
  }
  
  return { success: true, data: result.output };
}
```

### Combining with Other Validations

```typescript
import { createInsertSchema } from 'drizzle-valibot';
import { pipe, object, string, email, minLength, merge } from 'valibot';

const baseUserSchema = createInsertSchema(users);

// Add additional fields not in database
const extendedSchema = merge([
  baseUserSchema,
  object({
    confirmPassword: pipe(string(), minLength(8)),
    email: pipe(string(), email())
  })
]);
```

## Validation Methods

Valibot provides multiple validation approaches:

```typescript
import { 
  parse,       // Returns value or throws
  safeParse,   // Returns result object
  is,          // Returns boolean
  flatten,     // Flatten nested errors
  transform    // Transform during validation
} from 'valibot';

// Parse: Returns value or throws ValiError
const parsed = parse(schema, data);

// SafeParse: Returns { success, output?, issues? }
const result = safeParse(schema, data);
if (result.success) {
  console.log(result.output);
} else {
  console.log(result.issues);
}

// Is: Type guard
if (is(schema, data)) {
  // data is typed
}

// Flatten errors for easier consumption
const flat = flatten(result.issues);
// { nested: { field: ['error1', 'error2'] } }
```

## Tree-Shaking Benefits

Valibot's modular design means only used functions are bundled:

```typescript
// Only imports what you use
import { 
  string, 
  number, 
  object, 
  parse 
} from 'valibot';

// vs importing entire library
// import * as v from 'valibot';  // Larger bundle
```

This makes `drizzle-valibot` ideal for:
- Frontend applications with bundle size constraints
- Serverless functions with cold start concerns
- Edge computing environments

## Nullability Behavior (From Source Code)

Understanding how the schema generators handle nullability:

### Select Schema
```typescript
const table = pgTable('test', {
  c1: integer(),              // → v.union([v.pipe(v.number(), ...), v.null()])
  c2: integer().notNull(),    // → v.pipe(v.number(), ...)
});
```

### Insert Schema
```typescript
const table = pgTable('test', {
  c1: integer(),                          // nullable → v.optional(v.union([...num, v.null()]))
  c2: integer().notNull(),                // required → v.pipe(v.number(), ...)
  c3: integer().default(1),               // has default → v.optional(v.union([...num, v.null()]))
  c4: integer().notNull().default(1),     // notNull + default → v.optional(v.pipe(v.number(), ...))
  c5: integer().generatedAlwaysAs(1),     // EXCLUDED from schema
  c6: integer().generatedAlwaysAsIdentity(), // EXCLUDED from schema
  c7: integer().generatedByDefaultAsIdentity(), // included as optional
});
```

### Update Schema
```typescript
// All non-generated columns become optional
const schema = createUpdateSchema(table);
// All fields are v.optional(...)
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
import { custom } from 'valibot';

const rules = pgTable('rules', {
  config: json().$type<TopLevelCondition>().notNull(),
});

// For custom Valibot schema with type inference:
const ruleInsertSchema = createInsertSchema(rules, {
  config: custom<TopLevelCondition>((val) => {
    return typeof val === 'object' && val !== null && 'conditions' in val;
  }),
});
```

## Dialect-Specific Numeric Ranges

### PostgreSQL
```typescript
bigint({ mode: 'number' })
// → v.pipe(v.number(), v.minValue(-9007199254740991), v.maxValue(9007199254740991), v.integer())

bigint({ mode: 'bigint' })
// → v.pipe(v.bigint(), v.minValue(-9223372036854775808n), v.maxValue(9223372036854775807n))
```

### MySQL/SingleStore
```typescript
// Unsigned modifier detected from SQL type
int()
// → v.pipe(v.number(), v.minValue(-2147483648), v.maxValue(2147483647), v.integer())

int().unsigned()
// → v.pipe(v.number(), v.minValue(0), v.maxValue(4294967295), v.integer())

// MySQL-specific types
tinyint()           // minValue(-128), maxValue(127)
tinyint().unsigned() // minValue(0), maxValue(255)
year()              // minValue(1901), maxValue(2155)

// Serial in MySQL is unsigned bigint
serial() // minValue(0), maxValue(Number.MAX_SAFE_INTEGER)
```

### SQLite
```typescript
integer()
// → v.pipe(v.number(), v.minValue(Number.MIN_SAFE_INTEGER), v.maxValue(Number.MAX_SAFE_INTEGER), v.integer())

blob({ mode: 'bigint' })
// → v.pipe(v.bigint(), v.minValue(-9223372036854775808n), v.maxValue(9223372036854775807n))
```

## Internal JSON Schema

The built-in JSON schema used for `json()` and `jsonb()` columns:

```typescript
// From drizzle-valibot/src/column.ts
export const literalSchema = v.union([v.string(), v.number(), v.boolean(), v.null()]);
export const jsonSchema: v.GenericSchema<Json> = v.union([
  literalSchema,
  v.array(v.any()),
  v.record(v.string(), v.any()),
]);
```

## Buffer Schema

For SQLite blob columns:

```typescript
// From drizzle-valibot/src/column.ts
export const bufferSchema: v.GenericSchema<Buffer> = v.custom<Buffer>(
  (v) => v instanceof Buffer
);
```

## Enum Mapping Helper

Valibot uses a helper to map Drizzle enum values:

```typescript
// From drizzle-valibot/src/column.ts
export function mapEnumValues(values: string[]) {
  return Object.fromEntries(values.map((v) => [v, v])) as Record<string, string>;
}

// Usage: v.enum(mapEnumValues(['admin', 'user']))
```

## External Resources

- [Official Documentation](https://orm.drizzle.team/docs/valibot)
- [GitHub Repository](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-valibot)
- [Valibot Documentation](https://valibot.dev/)
