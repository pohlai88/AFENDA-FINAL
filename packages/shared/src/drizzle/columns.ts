/**
 * @layer shared
 * @responsibility Reusable column factories for Drizzle schema definitions.
 * 
 * @deprecated Use `@afenda/shared/drizzle/manifest` instead.
 * This file is kept for backward compatibility during migration.
 * 
 * @see packages/shared/src/drizzle/manifest/columns.ts
 * @see .dev-note/multi-tenancy-schema.md
 *
 * DRY timestamp and audit column patterns that repeat across every
 * domain schema. Each factory returns fresh PgColumnBuilder instances
 * (Drizzle binds builders at define-time, so tables cannot share builders).
 *
 * @example
 * ```ts
 * import { timestampColumns, auditColumns } from "@afenda/shared/drizzle";
 *
 * export const myTable = pgTable("my_table", {
 *   id: text("id").primaryKey(),
 *   ...timestampColumns(),
 *   ...auditColumns(),   // optional — adds createdBy, updatedBy
 * });
 * ```
 */

import { text, timestamp } from "drizzle-orm/pg-core";
import { TIMESTAMP_CONFIG } from "./constants";

/**
 * Standard `createdAt` + `updatedAt` columns.
 *
 * Both use `withTimezone: true, mode: "date"` and `defaultNow()`.
 * `updatedAt` should be maintained by a DB trigger (migration 0018)
 * or application code.
 */
export function timestampColumns() {
  return {
    createdAt: timestamp("created_at", TIMESTAMP_CONFIG).defaultNow(),
    updatedAt: timestamp("updated_at", TIMESTAMP_CONFIG).defaultNow(),
  };
}

/**
 * Immutable `createdAt`-only column (for append-only tables like audit logs).
 */
export function createdAtColumn() {
  return {
    createdAt: timestamp("created_at", TIMESTAMP_CONFIG).defaultNow(),
  };
}

/**
 * Actor tracking columns — records who created/updated a row.
 * Values are auth user IDs (text, not UUID).
 */
export function auditColumns() {
  return {
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  };
}
