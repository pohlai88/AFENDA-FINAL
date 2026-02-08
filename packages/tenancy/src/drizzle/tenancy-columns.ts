/**
 * @layer domain (tenancy)
 * @responsibility Tenancy column metadata registry — single source of truth
 * for all tenant-scoped column definitions.
 *
 * ## Why this exists
 *
 * When tenant-related column names are defined inline in every pgTable() call,
 * naming drift is inevitable:
 *
 *   - `tenant_id` → `tenantId` → `legacyTenantId`  (TS property name drift)
 *   - `tenant_id` → `legacy_tenant_id`              (DB column name drift)
 *   - MagicDrive has indexes, MagicTodo doesn't      (index inconsistency)
 *
 * This module follows the same factory-function pattern used by:
 *   - `drizzle-orm/neon` → `crudPolicy()`, `authenticatedRole`, `authUid()`
 *   - `drizzle-orm/supabase` → `anonRole`, `authUsers`, `realtimeMessages`
 *   - Neon infra (Rust) → `TenantId`, `TenantShardId` typed wrappers
 *
 * ## Usage
 *
 * ```ts
 * import { tenancyColumns, tenancyIndexes } from "@afenda/tenancy/drizzle";
 *
 * export const myDomainTable = pgTable("my_domain_table", {
 *   id: text("id").primaryKey(),
 *   name: text("name").notNull(),
 *   ...tenancyColumns.withLegacy(),     // legacy + org + team
 *   // or ...tenancyColumns.standard(), // org + team only (new tables)
 * }, (t) => [
 *   ...tenancyIndexes("my_domain_table", t),
 * ]);
 * ```
 */

import { text, index } from "drizzle-orm/pg-core";
import type { IndexBuilder, IndexColumn } from "drizzle-orm/pg-core";

// ─── Column Name Constants ───────────────────────────────────────────
// Single source of truth for DB column names (snake_case).
// If a rename is ever needed, change it HERE and the compiler will
// surface every downstream breakage via the TS property key.

export const TENANCY_DB_COLUMNS = {
  /** @deprecated Transitional — will be removed once org/team migration completes */
  LEGACY_TENANT_ID: "legacy_tenant_id",
  ORGANIZATION_ID: "organization_id",
  TEAM_ID: "team_id",
} as const;

// ─── Column Builder Factories ────────────────────────────────────────
// These return fresh PgColumnBuilder instances (they're NOT singletons).
// Drizzle binds builders to tables at define-time, so each table must
// receive its own builder instance — which is why these are functions.

/**
 * Columns for tables that still carry the legacy single-string tenant ID.
 * Use this during the migration period.
 *
 * Returns: `{ legacyTenantId, organizationId, teamId }`
 */
function withLegacy() {
  return {
    legacyTenantId: text(TENANCY_DB_COLUMNS.LEGACY_TENANT_ID).notNull(),
    organizationId: text(TENANCY_DB_COLUMNS.ORGANIZATION_ID),
    teamId: text(TENANCY_DB_COLUMNS.TEAM_ID),
  };
}

/**
 * Standard tenancy columns for new tables or tables that have completed
 * the legacy migration.
 *
 * Returns: `{ organizationId, teamId }`
 */
function standard() {
  return {
    organizationId: text(TENANCY_DB_COLUMNS.ORGANIZATION_ID),
    teamId: text(TENANCY_DB_COLUMNS.TEAM_ID),
  };
}

/**
 * Standard tenancy columns where organization is required (most common).
 *
 * Returns: `{ organizationId (notNull), teamId }`
 */
function required() {
  return {
    organizationId: text(TENANCY_DB_COLUMNS.ORGANIZATION_ID).notNull(),
    teamId: text(TENANCY_DB_COLUMNS.TEAM_ID),
  };
}

export const tenancyColumns = {
  /** Legacy + org + team (migration period) */
  withLegacy,
  /** Org (nullable) + team (nullable) */
  standard,
  /** Org (required) + team (nullable) — for new tables */
  required,
} as const;

// ─── Index Factory ───────────────────────────────────────────────────
// Generates consistent index names across all domain tables.
// Convention: `idx_{tableName}_{columnName}`

/**
 * Generate tenancy indexes for a table.
 *
 * @param tableName - The DB table name (used in index naming)
 * @param t - The table column reference from pgTable's third-arg callback
 * @returns An array of IndexBuilder instances to spread into the extraConfig
 *
 * @example
 * ```ts
 * export const myTable = pgTable("my_table", {
 *   id: text("id").primaryKey(),
 *   ...tenancyColumns.withLegacy(),
 * }, (t) => [
 *   ...tenancyIndexes("my_table", t),
 * ]);
 * ```
 */
export function tenancyIndexes(
  tableName: string,
  t: {
    legacyTenantId?: IndexColumn;
    organizationId?: IndexColumn;
    teamId?: IndexColumn;
  },
): IndexBuilder[] {
  const indexes: IndexBuilder[] = [];

  if (t.legacyTenantId) {
    indexes.push(
      index(`idx_${tableName}_legacy_tenant_id`).on(t.legacyTenantId),
    );
  }
  if (t.organizationId) {
    indexes.push(
      index(`idx_${tableName}_organization_id`).on(t.organizationId),
    );
  }
  if (t.teamId) {
    indexes.push(
      index(`idx_${tableName}_team_id`).on(t.teamId),
    );
  }

  return indexes;
}

// ─── Type Helpers ────────────────────────────────────────────────────
// Extract the TS types that correspond to each column set.
// Use these when you need to type function params or return values.

/** Row shape for tables with legacy tenant ID */
export type TenancyColumnsWithLegacy = {
  legacyTenantId: string;
  organizationId: string | null;
  teamId: string | null;
};

/** Row shape for standard tenancy (org + team) */
export type TenancyColumnsStandard = {
  organizationId: string | null;
  teamId: string | null;
};

/** Row shape for required tenancy (org required + team nullable) */
export type TenancyColumnsRequired = {
  organizationId: string;
  teamId: string | null;
};
