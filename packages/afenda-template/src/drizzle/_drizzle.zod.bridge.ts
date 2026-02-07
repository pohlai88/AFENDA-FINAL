import { z } from "zod";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";

/**
 * Bridge utilities between Drizzle and Zod schemas.
 *
 * Patterns:
 * - Convert Drizzle columns to Zod schemas
 * - Runtime validation with Zod
 * - Type-safe inserts/updates
 * - Form validation helpers
 */

/**
 * Create a Zod schema for insert operations.
 * Useful for validating user input before database inserts.
 */
export function createInsertSchema<T extends Record<string, any>>(
  zodSchema: z.ZodObject<any>
) {
  return zodSchema;
}

/**
 * Create a Zod schema for update operations.
 * Makes all fields optional for partial updates.
 */
export function createUpdateSchema<T extends Record<string, any>>(
  zodSchema: z.ZodObject<any>
) {
  return zodSchema.partial();
}

/**
 * Create a Zod schema for select operations.
 * Includes all fields from the table.
 */
export function createSelectSchema<T extends Record<string, any>>(
  zodSchema: z.ZodObject<any>
) {
  return zodSchema;
}

/**
 * Validate and parse data with a Zod schema.
 * Returns parsed data or throws validation error.
 */
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Safe parse with error handling.
 * Returns { success: true, data } or { success: false, error }.
 */
export function safeValidateData<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Extract validation errors in a user-friendly format.
 */
export function formatZodErrors(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Create a validation middleware for API routes.
 */
export function createValidator<T extends z.ZodType>(schema: T) {
  return (data: unknown) => {
    const result = safeValidateData(schema, data);
    if (!result.success) {
      throw new ValidationError("Validation failed", formatZodErrors(result.error));
    }
    return result.data as z.infer<T>;
  };
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string; code: string }>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Compose multiple validators.
 */
export function composeValidators<T extends z.ZodType[]>(...schemas: T) {
  return (data: unknown) => {
    for (const schema of schemas) {
      validateData(schema, data);
    }
    return data;
  };
}

/**
 * Create a refinement for unique constraint validation.
 */
export function uniqueConstraint<T>(
  checkFn: (value: T) => Promise<boolean>,
  message = "Value already exists"
) {
  return async (value: T, ctx: z.RefinementCtx) => {
    const exists = await checkFn(value);
    if (exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
      });
    }
  };
}

/**
 * Create a refinement for foreign key validation.
 */
export function foreignKeyConstraint<T>(
  checkFn: (value: T) => Promise<boolean>,
  message = "Referenced record does not exist"
) {
  return async (value: T, ctx: z.RefinementCtx) => {
    const exists = await checkFn(value);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
      });
    }
  };
}

/**
 * Helper to strip unknown fields from input.
 */
export function stripUnknown<T extends z.ZodType>(schema: T) {
  return (data: unknown): z.infer<T> => {
    const result = schema.safeParse(data);
    return result.success ? result.data : schema.parse(data);
  };
}

/**
 * Create a schema that accepts nullable fields as undefined.
 */
export function nullableToUndefined<T extends z.ZodType>(schema: T) {
  return schema.transform((val) => (val === null ? undefined : val));
}
