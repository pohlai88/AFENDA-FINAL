/**
 * Schema Manifest — Column Factories
 *
 * Unified column definitions enforcing Neon-Drizzle best practices.
 * All DB column names come from COLUMN_NAMES to prevent field name mismatch.
 *
 * @see https://orm.drizzle.team/docs/column-types/pg
 * @see ./column-names.ts (single source of truth for column name strings)
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
  type AnyPgColumn as _AnyPgColumn,
} from "drizzle-orm/pg-core";
import { TIMESTAMP_CONFIG } from "../constants";
import { COLUMN_NAMES } from "./column-names";

/**
 * Primary key — text (entity tables)
 * Use CUID2/nanoid in application code.
 */
export function pkText(name = COLUMN_NAMES.ID, maxLen = 128) {
  return varchar(name, { length: maxLen })
    .primaryKey()
    .notNull();
}

/**
 * Primary key — UUID (audit/junction tables)
 * Auto-generated via gen_random_uuid().
 */
export function pkUuid(name = COLUMN_NAMES.ID) {
  return uuid(name)
    .defaultRandom()
    .primaryKey()
    .notNull();
}

/**
 * Primary key — bigint (high-volume append-only tables)
 */
export function pkBigInt(name = COLUMN_NAMES.ID) {
  return bigint(name, { mode: "bigint" })
    .primaryKey()
    .notNull();
}

/**
 * Tenant ID — the single tenant discriminator
 * Foreign key to tenancy_organizations.id
 * NOT NULL — every domain row belongs to a tenant
 */
export function tenantId(name = COLUMN_NAMES.TENANT_ID) {
  return text(name).notNull();
}

/**
 * Team ID — optional sub-tenant grouping
 * Foreign key to tenancy_teams.id
 * Nullable — not all resources are team-scoped
 */
export function teamId(name = COLUMN_NAMES.TEAM_ID) {
  return text(name);
}

/**
 * User ID — row owner
 * NOT NULL for user-scoped resources
 */
export function userId(name = COLUMN_NAMES.USER_ID) {
  return text(name).notNull();
}

/**
 * User ID — optional row owner
 * Nullable for shared resources
 */
export function userIdOptional(name = COLUMN_NAMES.USER_ID) {
  return text(name);
}

/**
 * Timestamp columns — createdAt + updatedAt
 * Both NOT NULL, both defaultNow()
 * Use for tables with updates.
 */
export function timestamps() {
  return {
    createdAt: timestamp(COLUMN_NAMES.CREATED_AT, TIMESTAMP_CONFIG)
      .notNull()
      .defaultNow(),
    updatedAt: timestamp(COLUMN_NAMES.UPDATED_AT, TIMESTAMP_CONFIG)
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
    createdAt: timestamp(COLUMN_NAMES.CREATED_AT, TIMESTAMP_CONFIG)
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
    createdBy: text(COLUMN_NAMES.CREATED_BY),
    updatedBy: text(COLUMN_NAMES.UPDATED_BY),
  } as const;
}

/**
 * Soft delete columns
 * isDeleted: boolean default false
 * deletedAt: nullable timestamp
 */
export function softDelete() {
  return {
    isDeleted: boolean(COLUMN_NAMES.IS_DELETED)
      .notNull()
      .default(false),
    deletedAt: timestamp(COLUMN_NAMES.DELETED_AT, TIMESTAMP_CONFIG),
  } as const;
}

/**
 * Trace ID — tie DB records to request traces
 */
export function traceId(name = COLUMN_NAMES.TRACE_ID) {
  return text(name);
}

/**
 * Metadata — free-form JSONB
 * Always typed, always default to {}
 */
export function meta<T extends Record<string, unknown> = Record<string, unknown>>() {
  return {
    meta: jsonb(COLUMN_NAMES.META)
      .$type<T>()
      .notNull()
      .default({} as T),
  } as const;
}

/**
 * Sort order — integer for manual ordering
 */
export function sortOrder(name = COLUMN_NAMES.SORT_ORDER) {
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
