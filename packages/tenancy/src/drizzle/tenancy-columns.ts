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
 * ## Migration Path (Updated)
 *
 * **Legacy Pattern** (before multi-tenancy schema upgrade):
 *   - `organization_id` (nullable text)
 *   - `team_id` (nullable text)
 *   - `legacy_tenant_id` (nullable text, MagicDrive only)
 *
 * **New Pattern** (after schema manifest upgrade):
 *   - `tenant_id` (required text, FK to tenancy.teams.id)
 *   - `team_id` (required text, FK to tenancy.teams.id)
 *
 * @see packages/shared/src/drizzle/manifest/columns.ts (unified column factories)
 * @see .dev-note/multi-tenancy-schema.md (architecture decision record)
 *
 * ## Usage
 *
 * ```ts
 * import { tenancyColumns, tenancyIndexes } from "@afenda/tenancy/drizzle";
 *
 * export const myDomainTable = pgTable("my_domain_table", {
 *   id: text("id").primaryKey(),
 *   name: text("name").notNull(),
 *   ...tenancyColumns.withTenancy(),     // tenant_id + team_id (both required)
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
  /** New standard: every row belongs to a tenant (team) */
  TENANT_ID: "tenant_id",
  /** Team ID (same as tenant_id, denormalized for query clarity) */
  TEAM_ID: "team_id",
  /** @deprecated Legacy — for migration period only */
  LEGACY_TENANT_ID: "legacy_tenant_id",
  /** @deprecated Legacy — migrating to tenant_id */
  ORGANIZATION_ID: "organization_id",
} as const;

// ─── Column Builder Factories ────────────────────────────────────────
// These return fresh PgColumnBuilder instances (they're NOT singletons).
// Drizzle binds builders to tables at define-time, so each table must
// receive its own builder instance — which is why these are functions.

/**
 * **New Standard**: tenant_id + team_id (both required).
 *
 * Every domain row belongs to a tenant (team). The tenant_id maps to
 * tenancy.teams.id, which then links to tenancy.organizations via
 * tenancy.team_members.
 *
 * Returns: `{ tenantId, teamId }` (both notNull)
 */
function withTenancy() {
  return {
    tenantId: text(TENANCY_DB_COLUMNS.TENANT_ID).notNull(),
    teamId: text(TENANCY_DB_COLUMNS.TEAM_ID).notNull(),
  };
}

/**
 * **Legacy Pattern**: organization_id + team_id (both nullable).
 *
 * @deprecated Use `withTenancy()` for new tables.
 * This is kept for backward compatibility during the migration period.
 *
 * Returns: `{ organizationId, teamId }`
 */
function withLegacyOrgTeam() {
  return {
    organizationId: text(TENANCY_DB_COLUMNS.ORGANIZATION_ID),
    teamId: text(TENANCY_DB_COLUMNS.TEAM_ID),
  };
}

/**
 * **Legacy Pattern**: legacy_tenant_id + organization_id + team_id.
 *
 * @deprecated Only for MagicDrive during migration period.
 * This will be removed once migration 0020 (drop legacy_tenant_id) completes.
 *
 * Returns: `{ legacyTenantId, organizationId, teamId }`
 */
function withLegacyAll() {
  return {
    legacyTenantId: text(TENANCY_DB_COLUMNS.LEGACY_TENANT_ID).notNull(),
    organizationId: text(TENANCY_DB_COLUMNS.ORGANIZATION_ID),
    teamId: text(TENANCY_DB_COLUMNS.TEAM_ID),
  };
}

export const tenancyColumns = {
  /** NEW STANDARD: tenant_id + team_id (both required) */
  withTenancy,
  /** @deprecated Use withTenancy() for new tables */
  withLegacyOrgTeam,
  /** @deprecated MagicDrive only — migration period */
  withLegacyAll,
  
  // Backward compatibility aliases (to avoid breaking existing imports)
  /** @deprecated Renamed to withLegacyOrgTeam() */
  standard: withLegacyOrgTeam,
  /** @deprecated Renamed to withLegacyOrgTeam() */
  required: withLegacyOrgTeam,
  /** @deprecated Renamed to withLegacyAll() */
  withLegacy: withLegacyAll,
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
 *   ...tenancyColumns.withTenancy(),
 * }, (t) => [
 *   ...tenancyIndexes("my_table", t),
 * ]);
 * ```
 */
export function tenancyIndexes(
  tableName: string,
  t: {
    tenantId?: IndexColumn;
    teamId?: IndexColumn;
    legacyTenantId?: IndexColumn;
    organizationId?: IndexColumn;
  },
): IndexBuilder[] {
  const indexes: IndexBuilder[] = [];

  // New standard indexes (tenant_id + team_id)
  if (t.tenantId) {
    indexes.push(
      index(`idx_${tableName}_tenant_id`).on(t.tenantId),
    );
  }
  if (t.teamId) {
    indexes.push(
      index(`idx_${tableName}_team_id`).on(t.teamId),
    );
  }

  // Legacy indexes (for migration period)
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

  return indexes;
}

// ─── Type Helpers ────────────────────────────────────────────────────
// Extract the TS types that correspond to each column set.
// Use these when you need to type function params or return values.

/** Row shape for NEW STANDARD tenancy (tenant_id + team_id, both required) */
export type TenancyColumns = {
  tenantId: string;
  teamId: string;
};

/** Row shape for legacy pattern (org + team, both nullable) */
export type TenancyColumnsLegacyOrgTeam = {
  organizationId: string | null;
  teamId: string | null;
};

/** Row shape for legacy pattern with all three columns */
export type TenancyColumnsLegacyAll = {
  legacyTenantId: string;
  organizationId: string | null;
  teamId: string | null;
};

// Backward compatibility type aliases
/** @deprecated Use TenancyColumns instead */
export type TenancyColumnsStandard = TenancyColumnsLegacyOrgTeam;
/** @deprecated Use TenancyColumns instead */
export type TenancyColumnsRequired = TenancyColumnsLegacyOrgTeam;
/** @deprecated Use TenancyColumnsLegacyAll instead */
export type TenancyColumnsWithLegacy = TenancyColumnsLegacyAll;
