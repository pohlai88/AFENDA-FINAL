import { bigint, boolean, integer, jsonb, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Core DB columns (truth primitives).
 * - No business logic.
 * - Prefer composable column groups.
 */

export function pkUuid(name = "id") {
  return uuid(name).defaultRandom().primaryKey().notNull();
}

/** If you standardize string IDs later, swap implementation here. */
export function pkText(name = "id", maxLen = 128) {
  return varchar(name, { length: maxLen }).primaryKey().notNull();
}

export function tenantCols() {
  return {
    tenantId: text("tenant_id").notNull(),
  } as const;
}

export function actorCols() {
  return {
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  } as const;
}

export function timeCols() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  } as const;
}

export function softDeleteCols() {
  return {
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  } as const;
}

/** Tie DB records to request traces (optional). */
export function traceCols() {
  return {
    traceId: text("trace_id"),
  } as const;
}

/** Free-form metadata, always JSONB. */
export function metaCols<T extends Record<string, unknown> = Record<string, unknown>>() {
  return {
    meta: jsonb("meta").$type<T>().notNull().default({} as T),
  } as const;
}

/** Sorting utilities */
export function sortCols() {
  return {
    sortOrder: integer("sort_order").notNull().default(0),
  } as const;
}

/** Big integer ID (optional) */
export function pkBigInt(name = "id") {
  return bigint(name, { mode: "bigint" }).primaryKey().notNull();
}
