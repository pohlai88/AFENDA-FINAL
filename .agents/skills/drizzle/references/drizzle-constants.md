# Drizzle Schema Generator Constants

This document provides the internal numeric constants used by all drizzle-* schema validation packages. These constants define the valid ranges for different SQL integer types across databases.

## Source

From `drizzle-team/drizzle-orm` repository:
- `drizzle-zod/src/constants.ts`
- `drizzle-typebox/src/constants.ts`
- `drizzle-valibot/src/constants.ts`
- `drizzle-arktype/src/constants.ts`

All packages share identical constant values.

## Constants Reference

```typescript
export const CONSTANTS = {
  // 8-bit integers (MySQL/SingleStore tinyint)
  INT8_MIN: -128,
  INT8_MAX: 127,
  INT8_UNSIGNED_MAX: 255,

  // 16-bit integers (smallint)
  INT16_MIN: -32768,
  INT16_MAX: 32767,
  INT16_UNSIGNED_MAX: 65535,

  // 24-bit integers (MySQL/SingleStore mediumint)
  INT24_MIN: -8388608,
  INT24_MAX: 8388607,
  INT24_UNSIGNED_MAX: 16777215,

  // 32-bit integers (integer/int)
  INT32_MIN: -2147483648,
  INT32_MAX: 2147483647,
  INT32_UNSIGNED_MAX: 4294967295,

  // 48-bit floating point range (real, double precision, float)
  INT48_MIN: -140737488355328,
  INT48_MAX: 140737488355327,
  INT48_UNSIGNED_MAX: 281474976710655,

  // 64-bit integers (bigint)
  INT64_MIN: -9223372036854775808n,
  INT64_MAX: 9223372036854775807n,
  INT64_UNSIGNED_MAX: 18446744073709551615n,
};
```

## Column Type to Constants Mapping

### Integer Types

| SQL Column Type | Dialect | Min Constant | Max Constant |
|-----------------|---------|--------------|--------------|
| `tinyint()` | MySQL, SingleStore | `INT8_MIN` | `INT8_MAX` |
| `tinyint().unsigned()` | MySQL, SingleStore | `0` | `INT8_UNSIGNED_MAX` |
| `smallint()` | All | `INT16_MIN` | `INT16_MAX` |
| `smallint().unsigned()` | MySQL, SingleStore | `0` | `INT16_UNSIGNED_MAX` |
| `mediumint()` | MySQL, SingleStore | `INT24_MIN` | `INT24_MAX` |
| `mediumint().unsigned()` | MySQL, SingleStore | `0` | `INT24_UNSIGNED_MAX` |
| `integer()` / `int()` | All | `INT32_MIN` | `INT32_MAX` |
| `integer().unsigned()` | MySQL, SingleStore | `0` | `INT32_UNSIGNED_MAX` |
| `bigint({ mode: 'bigint' })` | All | `INT64_MIN` | `INT64_MAX` |
| `bigint({ mode: 'bigint' }).unsigned()` | MySQL, SingleStore | `0n` | `INT64_UNSIGNED_MAX` |

### Special Integer Modes

| SQL Column Type | Range | Notes |
|-----------------|-------|-------|
| `bigint({ mode: 'number' })` | `Number.MIN_SAFE_INTEGER` to `Number.MAX_SAFE_INTEGER` | JS safe integer limits |
| `serial()` (PostgreSQL) | `1` to `INT32_MAX` | Auto-incrementing |
| `smallserial()` (PostgreSQL) | `1` to `INT16_MAX` | Auto-incrementing |
| `bigserial({ mode: 'number' })` | `1` to `Number.MAX_SAFE_INTEGER` | Auto-incrementing |
| `serial()` (MySQL) | `0` to `Number.MAX_SAFE_INTEGER` | Unsigned auto-increment |

### Floating Point Types

| SQL Column Type | Dialect | Min Constant | Max Constant |
|-----------------|---------|--------------|--------------|
| `real()` | All | `INT48_MIN` | `INT48_MAX` |
| `doublePrecision()` | PostgreSQL | `INT48_MIN` | `INT48_MAX` |
| `double()` | MySQL, SingleStore | `INT48_MIN` | `INT48_MAX` |
| `float()` | MySQL, SingleStore | `INT24_MIN` | `INT24_MAX` |
| `real().unsigned()` | MySQL, SingleStore | `0` | `INT48_UNSIGNED_MAX` |
| `double().unsigned()` | MySQL, SingleStore | `0` | `INT48_UNSIGNED_MAX` |
| `float().unsigned()` | MySQL, SingleStore | `0` | `INT24_UNSIGNED_MAX` |

### Special Numeric Types

| SQL Column Type | Range | Notes |
|-----------------|-------|-------|
| `year()` (MySQL/SingleStore) | `1901` to `2155` | Year only |
| `numeric()` / `decimal()` | N/A | Returns string (arbitrary precision) |

## Usage in Schema Validation

### Zod Example
```typescript
// Generated schema for integer()
z.number()
  .min(CONSTANTS.INT32_MIN)
  .max(CONSTANTS.INT32_MAX)
  .int();

// Generated schema for bigint({ mode: 'bigint' })
z.bigint()
  .gte(CONSTANTS.INT64_MIN)
  .lte(CONSTANTS.INT64_MAX);

// Generated schema for tinyint().unsigned()
z.number()
  .min(0)
  .max(CONSTANTS.INT8_UNSIGNED_MAX)
  .int();
```

### TypeBox Example
```typescript
// Generated schema for integer()
t.Integer({
  minimum: CONSTANTS.INT32_MIN,
  maximum: CONSTANTS.INT32_MAX,
});

// Generated schema for bigint({ mode: 'bigint' })
t.BigInt({
  minimum: CONSTANTS.INT64_MIN,
  maximum: CONSTANTS.INT64_MAX,
});
```

### Valibot Example
```typescript
// Generated schema for integer()
v.pipe(
  v.number(),
  v.minValue(CONSTANTS.INT32_MIN),
  v.maxValue(CONSTANTS.INT32_MAX),
  v.integer()
);
```

### ArkType Example
```typescript
// Generated schema for integer()
type.keywords.number.integer
  .atLeast(CONSTANTS.INT32_MIN)
  .atMost(CONSTANTS.INT32_MAX);

// Generated schema for bigint({ mode: 'bigint' })
type.bigint.narrow(bigintNarrow);
// Where bigintNarrow validates against INT64_MIN/INT64_MAX
```

## Internal Column Type Detection

The schema generators use `isColumnType<T>()` to detect column types:

```typescript
// Example from drizzle-arktype/src/column.ts
function numberColumnToSchema(column: Column): Type<number, any> {
  let unsigned = column.getSQLType().includes('unsigned');
  
  if (isColumnType<MySqlTinyInt | SingleStoreTinyInt>(column, ['MySqlTinyInt', 'SingleStoreTinyInt'])) {
    min = unsigned ? 0 : CONSTANTS.INT8_MIN;
    max = unsigned ? CONSTANTS.INT8_UNSIGNED_MAX : CONSTANTS.INT8_MAX;
    integer = true;
  }
  // ... similar for other integer types
}
```

## Text Length Constants

For text columns, length limits are also enforced:

| SQL Column Type | Max Length Constant |
|-----------------|---------------------|
| `text()` (MySQL) | `INT16_UNSIGNED_MAX` (65535) |
| `mediumtext()` (MySQL) | `INT24_UNSIGNED_MAX` (16777215) |
| `longtext()` (MySQL) | `INT32_UNSIGNED_MAX` (4294967295) |
| `tinytext()` (MySQL) | `INT8_UNSIGNED_MAX` (255) |
| `varchar({ length: n })` | `n` |
| `char({ length: n })` | Exactly `n` |

## BigInt Narrowing Functions

For ArkType bigint validation, custom narrow functions are used:

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
```

## JSON Schema Pattern

All packages define the same JSON schema pattern:

```typescript
// literalSchema: string | number | boolean | null
export const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

// jsonSchema: recursive JSON type
export const jsonSchema = z.union([
  literalSchema,
  z.record(z.string(), z.any()),
  z.array(z.any()),
]);
```
