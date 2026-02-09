/**
 * Schema Manifest — Column Factories
 * 
 * Unified column definitions enforcing Neon-Drizzle best practices:
 * - timestamptz (never timestamp)
 * - text PKs for entity tables (CUID2/nanoid)
 * - uuid PKs for audit/junction tables
 * - tenant_id as the single tenant discriminator
 * - Composable column groups
 * 
 * @see https://orm.drizzle.team/docs/column-types/pg
 */

import {
  bigint,
  boolean,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { TIMESTAMP_CONFIG } from "../constants";

/**
 * Primary key — text (entity tables)
 * Use CUID2/nanoid in application code.
 */
export function pkText(name = "id", maxLen = 128) {
  return varchar(name, { length: maxLen })
    .primaryKey()
    .notNull();
}

/**
 * Primary key — UUID (audit/junction tables)
 * Auto-generated via gen_random_uuid().
 */
export function pkUuid(name = "id") {
  return uuid(name)
    .defaultRandom()
    .primaryKey()
    .notNull();
}

/**
 * Primary key — bigint (high-volume append-only tables)
 */
export function pkBigInt(name = "id") {
  return bigint(name, { mode: "bigint" })
    .primaryKey()
    .notNull();
}

/**
 * Tenant ID — the single tenant discriminator
 * Foreign key to tenancy_organizations.id
 * NOT NULL — every domain row belongs to a tenant
 */
export function tenantId(name = "tenant_id") {
  return text(name).notNull();
}

/**
 * Team ID — optional sub-tenant grouping
 * Foreign key to tenancy_teams.id
 * Nullable — not all resources are team-scoped
 */
export function teamId(name = "team_id") {
  return text(name);
}

/**
 * User ID — row owner
 * NOT NULL for user-scoped resources
 */
export function userId(name = "user_id") {
  return text(name).notNull();
}

/**
 * User ID — optional row owner
 * Nullable for shared resources
 */
export function userIdOptional(name = "user_id") {
  return text(name);
}

/**
 * Timestamp columns — createdAt + updatedAt
 * Both NOT NULL, both defaultNow()
 * Use for tables with updates.
 */
export function timestamps() {
  return {
    createdAt: timestamp("created_at", TIMESTAMP_CONFIG)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", TIMESTAMP_CONFIG)
      .notNull()
      .defaultNow(),
  } as const;
}

/**
 * Timestamp — createdAt only
 * Use for append-only tables (audit logs, events).
 */
export function createdAtOnly() {
  return {
    createdAt: timestamp("created_at", TIMESTAMP_CONFIG)
      .notNull()
      .defaultNow(),
  } as const;
}

/**
 * Audit actor columns — createdBy + updatedBy
 * Both nullable text (user IDs)
 */
export function auditActors() {
  return {
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  } as const;
}

/**
 * Soft delete columns
 * isDeleted: boolean default false
 * deletedAt: nullable timestamp
 */
export function softDelete() {
  return {
    isDeleted: boolean("is_deleted")
      .notNull()
      .default(false),
    deletedAt: timestamp("deleted_at", TIMESTAMP_CONFIG),
  } as const;
}

/**
 * Trace ID — tie DB records to request traces
 */
export function traceId(name = "trace_id") {
  return text(name);
}

/**
 * Metadata — free-form JSONB
 * Always typed, always default to {}
 */
export function meta<T extends Record<string, unknown> = Record<string, unknown>>() {
  return {
    meta: jsonb("meta")
      .$type<T>()
      .notNull()
      .default({} as T),
  } as const;
}

/**
 * Sort order — integer for manual ordering
 */
export function sortOrder(name = "sort_order") {
  return integer(name)
    .notNull()
    .default(0);
}

/**
 * Generic text column — NOT NULL
 */
export function textRequired(name: string, maxLen?: number) {
  return maxLen ? varchar(name, { length: maxLen }).notNull() : text(name).notNull();
}

/**
 * Generic text column — nullable
 */
export function textOptional(name: string, maxLen?: number) {
  return maxLen ? varchar(name, { length: maxLen }) : text(name);
}
