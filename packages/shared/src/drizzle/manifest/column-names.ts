/**
 * Schema Manifest — Column Name Registry
 *
 * Single source of truth for all canonical DB column names (snake_case).
 * Use these constants everywhere column names are referenced (Drizzle column
 * definitions, index names, RLS SQL, migrations) to prevent field name mismatch
 * and drift across domains.
 *
 * Rules:
 * - All shared manifest column factories use COLUMN_NAMES (manifest/columns.ts).
 * - Tenant columns (tenant_id, team_id, organization_id, legacy_tenant_id) live
 *   in @afenda/tenancy/drizzle (TENANCY_DB_COLUMNS); use those in domain schemas.
 * - Never hardcode column name strings in schema files — import from this file
 *   or from tenancy TENANCY_DB_COLUMNS.
 *
 * @see packages/tenancy/src/drizzle/tenancy-columns.ts for tenant column names
 * @see .dev-note/03-SHARED-INFRASTRUCTURE.md § Column name registry
 */

export const COLUMN_NAMES = {
  // Identity & keys
  ID: "id",

  // Tenancy (canonical names; for index/RLS references; domain schemas use tenancyColumns from tenancy)
  TENANT_ID: "tenant_id",
  TEAM_ID: "team_id",
  USER_ID: "user_id",

  // Timestamps
  CREATED_AT: "created_at",
  UPDATED_AT: "updated_at",
  DELETED_AT: "deleted_at",

  // Audit
  CREATED_BY: "created_by",
  UPDATED_BY: "updated_by",

  // Soft delete
  IS_DELETED: "is_deleted",

  // Misc
  TRACE_ID: "trace_id",
  META: "meta",
  SORT_ORDER: "sort_order",
} as const;

export type ColumnName = (typeof COLUMN_NAMES)[keyof typeof COLUMN_NAMES];
