import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { Table } from "drizzle-orm";
import { z } from "zod";

/**
 * Derivation utilities:
 * - The artifact is Zod → stays in /zod
 * - Source truth is Drizzle → imported from /drizzle
 */

export function deriveSelectSchema<TTable extends Table>(table: TTable) {
  return createSelectSchema(table);
}

export function deriveInsertSchema<TTable extends Table>(table: TTable) {
  return createInsertSchema(table);
}

/**
 * Optional: enforce strict objects for API boundaries.
 */
export function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}
