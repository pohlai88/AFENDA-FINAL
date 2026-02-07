# drizzle-arktype Reference

`drizzle-arktype` generates [ArkType](https://arktype.io/) schemas from Drizzle ORM schemas, enabling advanced type inference with expressive, readable syntax.

## Installation

```bash
npm i drizzle-arktype
# or
pnpm add drizzle-arktype
```

## Version Requirements

- **drizzle-arktype:** v0.1.0 or higher
- **Drizzle ORM:** v0.36.0 or greater
- **ArkType:** v2.0.0 or greater

## Core Functions

### createSelectSchema

Generates an ArkType schema matching data queried from database.

```typescript
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-arktype';

const users = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: text().notNull(),
  age: integer().notNull()
});

const userSelectSchema = createSelectSchema(users);

// ArkType schemas are callable - returns validated data or throws
const parsed: { id: number; name: string; age: number } = userSelectSchema(rows[0]);
```

### createInsertSchema

Generates an ArkType schema for INSERT validation.

```typescript
import { createInsertSchema } from 'drizzle-arktype';

const userInsertSchema = createInsertSchema(users);

// Type: { name: string; age: number }
const parsed = userInsertSchema({ name: 'Jane', age: 30 });
await db.insert(users).values(parsed);
```

### createUpdateSchema

Generates an ArkType schema for UPDATE validation. All fields become optional.

```typescript
import { createUpdateSchema } from 'drizzle-arktype';

const userUpdateSchema = createUpdateSchema(users);

// Type: { name?: string | undefined; age?: number | undefined }
const parsed = userUpdateSchema({ age: 35 });
await db.update(users).set(parsed).where(eq(users.name, 'Jane'));
```

## Views and Enums Support

```typescript
import { pgEnum, pgView } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-arktype';

// Enums
const roles = pgEnum('roles', ['admin', 'basic']);
const rolesSchema = createSelectSchema(roles);
const parsed: 'admin' | 'basic' = rolesSchema(...);

// Views
const usersView = pgView('users_view').as((qb) => 
  qb.select().from(users).where(gt(users.age, 18))
);
const usersViewSchema = createSelectSchema(usersView);
```

## Refinements

Extend, modify, or overwrite field schemas using ArkType's pipe syntax:

```typescript
import { createSelectSchema } from 'drizzle-arktype';
import { pipe, maxLength, object, string } from 'arktype';

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

| Drizzle Type | ArkType Schema |
|--------------|----------------|
| `boolean()` | `type.boolean` |
| `text()`, `varchar()` | `type.string` |
| `integer()`, `serial()` | `type.keywords.number.integer` |
| `real()`, `doublePrecision()` | `type.number` |
| `bigint({ mode: 'bigint' })` | `type.bigint` |

### Dates

| Drizzle Type | ArkType Schema |
|--------------|----------------|
| `date({ mode: 'date' })` | `type.Date` |
| `timestamp({ mode: 'date' })` | `type.Date` |
| `date({ mode: 'string' })` | `type.string` |
| `timestamp({ mode: 'string' })` | `type.string` |

### Constrained Types

| Drizzle Type | ArkType Schema |
|--------------|----------------|
| `char({ length: 10 })` | `type.string.exactlyLength(10)` |
| `varchar({ length: 255 })` | `type.string.atMostLength(255)` |
| `uuid()` | `type(/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu)` |
| `bit({ dimensions: n })` | `type(/^[01]{n}$/)` |

### Numeric Ranges

| Drizzle Type | ArkType Schema |
|--------------|----------------|
| `tinyint()` | `type.keywords.number.integer.atLeast(-128).atMost(127)` |
| `smallint()` | `type.keywords.number.integer.atLeast(-32768).atMost(32767)` |
| `integer()` | `type.keywords.number.integer.atLeast(-2147483648).atMost(2147483647)` |
| `bigint({ mode: 'number' })` | `type.keywords.number.integer.atLeast(-9007199254740991).atMost(9007199254740991)` |
| `tinyint({ unsigned: true })` | `type.keywords.number.integer.atLeast(0).atMost(255)` |
| `smallint({ unsigned: true })` | `type.keywords.number.integer.atLeast(0).atMost(65535)` |
| `int({ unsigned: true })` | `type.keywords.number.integer.atLeast(0).atMost(4294967295)` |

### BigInt with Narrowing

```typescript
// bigint with 64-bit range uses narrow()
type.bigint.narrow(
  (value, ctx) => 
    value < -9223372036854775808n ? ctx.mustBe('greater than') :
    value > 9223372036854775807n ? ctx.mustBe('less than') : true
)

// unsigned bigint
type.bigint.narrow(
  (value, ctx) =>
    value < 0n ? ctx.mustBe('greater than') :
    value > 18446744073709551615n ? ctx.mustBe('less than') : true
)
```

### MySQL Text Types

| Drizzle Type | ArkType Schema |
|--------------|----------------|
| `tinytext()` | `type.string.atMostLength(255)` |
| `text()` | `type.string.atMostLength(65535)` |
| `mediumtext()` | `type.string.atMostLength(16777215)` |
| `longtext()` | `type.string.atMostLength(4294967295)` |

### PostgreSQL Special

| Drizzle Type | ArkType Schema |
|--------------|----------------|
| `enum(['a', 'b'])` | `type.enumerated(...enum)` |
| `point({ mode: 'tuple' })` | `type([type.number, type.number])` |
| `point({ mode: 'xy' })` | `type({ x: type.number, y: type.number })` |
| `vector({ dimensions: 3 })` | `type.number.array().exactlyLength(3)` |
| `line({ mode: 'abc' })` | `type({ a: type.number, b: type.number, c: type.number })` |
| `line({ mode: 'tuple' })` | `type([type.number, type.number, type.number])` |

### JSON Types

| Drizzle Type | ArkType Schema |
|--------------|----------------|
| `json()`, `jsonb()` | `type('string \| number \| boolean \| null').or(type('unknown.any[] \| Record<string, unknown.any>'))` |

### Buffer Types

| Drizzle Type | ArkType Schema |
|--------------|----------------|
| `blob({ mode: 'buffer' })` | `type.instanceOf(Buffer)` |

### Array Types

| Drizzle Type | ArkType Schema |
|--------------|----------------|
| `dataType().array(size)` | `baseDataTypeSchema.array().exactlyLength(size)` |

## Common Patterns

### API Request Validation

```typescript
import { createInsertSchema } from 'drizzle-arktype';

const userInsertSchema = createInsertSchema(users);

export async function POST(req: Request) {
  const body = await req.json();
  
  // ArkType schemas are callable
  const result = userInsertSchema(body);
  
  // Check for errors
  if (result instanceof type.errors) {
    return Response.json({ 
      errors: result.summary 
    }, { status: 400 });
  }
  
  // Type-safe after validation
  await db.insert(users).values(result);
  return Response.json({ success: true });
}
```

### Type Guard Pattern

```typescript
import { createSelectSchema } from 'drizzle-arktype';

const userSchema = createSelectSchema(users);

function isUser(data: unknown): data is typeof userSchema.infer {
  const result = userSchema(data);
  return !(result instanceof type.errors);
}

// Use as type guard
if (isUser(data)) {
  console.log(data.name); // TypeScript knows data.name exists
}
```

### Error Handling

```typescript
import { createInsertSchema } from 'drizzle-arktype';
import { type } from 'arktype';

const userInsertSchema = createInsertSchema(users);

function validateUser(data: unknown) {
  const result = userInsertSchema(data);
  
  if (result instanceof type.errors) {
    // Get error summary
    console.log(result.summary);
    
    // Iterate individual errors
    for (const error of result) {
      console.log(error.path, error.message);
    }
    
    return { success: false, errors: result };
  }
  
  return { success: true, data: result };
}
```

### Combining Schemas

```typescript
import { createInsertSchema } from 'drizzle-arktype';
import { type } from 'arktype';

const baseUserSchema = createInsertSchema(users);

// Extend with additional fields
const extendedSchema = type({
  ...baseUserSchema.definition,
  confirmPassword: 'string>=8',
  acceptTerms: 'true'
});
```

### Express Pattern

```typescript
import { type } from 'arktype';
import { createInsertSchema } from 'drizzle-arktype';

const userInsertSchema = createInsertSchema(users);

// Middleware factory
function validate<T>(schema: type<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema(req.body);
    if (result instanceof type.errors) {
      return res.status(400).json({ errors: result.summary });
    }
    req.body = result;
    next();
  };
}

app.post('/users', validate(userInsertSchema), async (req, res) => {
  await db.insert(users).values(req.body);
  res.json({ success: true });
});
```

## ArkType Syntax Features

ArkType uses expressive string syntax for type definitions:

```typescript
import { type } from 'arktype';

// String-based type definition
const userType = type({
  name: 'string>=2',           // string, minLength 2
  age: 'integer>=0',           // integer, >= 0
  email: 'email',              // built-in email validation
  role: "'admin'|'user'",      // literal union
  scores: 'number[]',          // array of numbers
  metadata: 'Record<string, unknown>'  // record type
});

// Chained refinements
const nameType = type.string.atLeastLength(2).atMostLength(100);

// Numeric bounds
const ageType = type.number.integer.atLeast(0).atMost(150);
```

## Type Inference

ArkType provides excellent type inference:

```typescript
const userSchema = createSelectSchema(users);

// Infer the type from schema
type User = typeof userSchema.infer;

// User is now: { id: number; name: string; age: number }
```

## Nullability Behavior (From Source Code)

Understanding how the schema generators handle nullability:

### Select Schema
```typescript
const table = pgTable('test', {
  c1: integer(),              // → integerSchema.or(type.null)
  c2: integer().notNull(),    // → integerSchema
});
```

### Insert Schema
```typescript
const table = pgTable('test', {
  c1: integer(),                          // nullable → integerSchema.or(type.null).optional()
  c2: integer().notNull(),                // required → integerSchema
  c3: integer().default(1),               // has default → integerSchema.or(type.null).optional()
  c4: integer().notNull().default(1),     // notNull + default → integerSchema.optional()
  c5: integer().generatedAlwaysAs(1),     // EXCLUDED from schema
  c6: integer().generatedAlwaysAsIdentity(), // EXCLUDED from schema
  c7: integer().generatedByDefaultAsIdentity(), // included as optional
});
```

### Update Schema
```typescript
// All non-generated columns become optional
const schema = createUpdateSchema(table);
// All fields are .optional()
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

For complex JSON structures, ArkType handles them elegantly:

```typescript
import type { TopLevelCondition } from 'json-rules-engine';
import { Type, type } from 'arktype';

const rules = pgTable('rules', {
  config: json().$type<TopLevelCondition>().notNull(),
});

// Create a custom ArkType schema for the complex type
const TopLevelConditionType: Type<TopLevelCondition, {}> = type('unknown.any') as any;

// The test files show this pattern:
const table = pgTable('test', {
  json1: text({ mode: 'json' }).$type<TopLevelCondition>().notNull(),
  json2: blob({ mode: 'json' }).$type<TopLevelCondition>(),
});

const result = createSelectSchema(table);
// json1 field will use the inferred TopLevelCondition type
// json2 field will be TopLevelCondition.or(type.null)
```

## BigInt Narrow Functions (Unique to ArkType)

ArkType uses custom narrow functions for bigint validation:

```typescript
// From drizzle-arktype/src/column.ts
export const bigintNarrow = (v: bigint, ctx: { mustBe: (expected: string) => false }) =>
  v < CONSTANTS.INT64_MIN 
    ? ctx.mustBe('greater than')
    : v > CONSTANTS.INT64_MAX 
      ? ctx.mustBe('less than') 
      : true;

export const unsignedBigintNarrow = (v: bigint, ctx: { mustBe: (expected: string) => false }) =>
  v < 0n 
    ? ctx.mustBe('greater than')
    : v > CONSTANTS.INT64_UNSIGNED_MAX 
      ? ctx.mustBe('less than') 
      : true;

// Usage in generated schema:
bigint({ mode: 'bigint' }) // → type.bigint.narrow(bigintNarrow)
bigint({ mode: 'bigint' }).unsigned() // → type.bigint.narrow(unsignedBigintNarrow)
```

## Dialect-Specific Numeric Ranges

### PostgreSQL
```typescript
bigint({ mode: 'number' })
// → type.keywords.number.integer.atLeast(Number.MIN_SAFE_INTEGER).atMost(Number.MAX_SAFE_INTEGER)

bigint({ mode: 'bigint' })
// → type.bigint.narrow(bigintNarrow)

integer()
// → type.keywords.number.integer.atLeast(CONSTANTS.INT32_MIN).atMost(CONSTANTS.INT32_MAX)
```

### MySQL/SingleStore
```typescript
// Unsigned modifier detected from SQL type
int()
// → type.keywords.number.integer.atLeast(CONSTANTS.INT32_MIN).atMost(CONSTANTS.INT32_MAX)

int().unsigned()
// → type.keywords.number.integer.atLeast(0).atMost(CONSTANTS.INT32_UNSIGNED_MAX)

// MySQL-specific types
tinyint()           // atLeast(-128).atMost(127)
tinyint().unsigned() // atLeast(0).atMost(255)
year()              // atLeast(1901).atMost(2155)

// Serial in MySQL is unsigned bigint  
serial() // atLeast(0).atMost(Number.MAX_SAFE_INTEGER)
```

### SQLite
```typescript
integer()
// → type.keywords.number.integer.atLeast(Number.MIN_SAFE_INTEGER).atMost(Number.MAX_SAFE_INTEGER)

blob({ mode: 'bigint' })
// → type.bigint.narrow(bigintNarrow)
```

## Internal Schemas

### Literal and JSON Schema
```typescript
// From drizzle-arktype/src/column.ts
export const literalSchema = type.string.or(type.number).or(type.boolean).or(type.null);
export const jsonSchema = literalSchema
  .or(type.unknown.as<any>().array())
  .or(type.object.as<Record<string, any>>());
```

### Buffer Schema
```typescript
// From drizzle-arktype/src/column.ts
export const bufferSchema = type.unknown
  .narrow((value) => value instanceof Buffer)
  .as<Buffer>()
  .describe('a Buffer instance');
```

## Enum Handling

ArkType uses `type.enumerated()` for enum columns:

```typescript
// Drizzle enum
const roleEnum = pgEnum('role', ['admin', 'user', 'guest']);

// Generated schema
const roleSchema = type.enumerated('admin', 'user', 'guest');
```

## Internal Column Type Detection

ArkType uses `isColumnType<T>()` for type detection:

```typescript
// From drizzle-arktype/src/column.ts
function numberColumnToSchema(column: Column): Type<number, any> {
  let unsigned = column.getSQLType().includes('unsigned');
  let min!: number;
  let max!: number;
  let integer = false;

  if (isColumnType<MySqlTinyInt | SingleStoreTinyInt>(column, ['MySqlTinyInt', 'SingleStoreTinyInt'])) {
    min = unsigned ? 0 : CONSTANTS.INT8_MIN;
    max = unsigned ? CONSTANTS.INT8_UNSIGNED_MAX : CONSTANTS.INT8_MAX;
    integer = true;
  }
  // ... similar patterns for other integer types
}
```

## External Resources

- [Official Documentation](https://orm.drizzle.team/docs/arktype)
- [GitHub Repository](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-arktype)
- [ArkType Documentation](https://arktype.io/)
