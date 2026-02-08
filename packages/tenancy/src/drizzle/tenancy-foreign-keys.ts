/**
 * @layer domain (tenancy)
 * @responsibility FK constraint factories for cross-domain tenancy references.
 *
 * ## Why this is a separate file
 *
 * `tenancy-columns.ts` is imported by `tenancy.schema.ts` (which defines
 * the target tables `tenancyOrganizations` and `tenancyTeams`). Putting
 * FK builders in `tenancy-columns.ts` would create a circular import.
 *
 * This module imports from `tenancy.schema.ts` directly, so it can
 * reference the actual table objects for type-safe FK declarations.
 *
 * ## Usage
 *
 * ```ts
 * import { tenancyColumns } from "@afenda/tenancy/drizzle";
 * import { tenancyForeignKeys } from "@afenda/tenancy/drizzle";
 *
 * export const myTable = pgTable("my_table", {
 *   id: text("id").primaryKey(),
 *   ...tenancyColumns.standard(),
 * }, (t) => [
 *   ...tenancyForeignKeys("my_table", t),
 * ]);
 * ```
 *
 * Or in object-style extraConfig:
 *
 * ```ts
 * (table) => ({
 *   orgFk:  tenancyForeignKeys("my_table", table)[0],
 *   teamFk: tenancyForeignKeys("my_table", table)[1],
 * })
 * ```
 */

import { foreignKey } from "drizzle-orm/pg-core";
import type { ForeignKeyBuilder, AnyPgColumn } from "drizzle-orm/pg-core";
import { tenancyOrganizations, tenancyTeams } from "./tenancy.schema";

// ─── FK Constraint Naming Convention ─────────────────────────────────
// Pattern: `fk_{tableName}_{targetDomain}`
// e.g. `fk_magictodo_tasks_organization`, `fk_magicdrive_objects_team`

export type TenancyFkOnDelete = "set null" | "cascade" | "restrict" | "no action";

export interface TenancyForeignKeysOptions {
  /** ON DELETE behavior for the organization FK. Default: "set null" */
  onDeleteOrg?: TenancyFkOnDelete;
  /** ON DELETE behavior for the team FK. Default: "set null" */
  onDeleteTeam?: TenancyFkOnDelete;
}

/**
 * Generate FK constraints linking `organizationId` → `tenancy_organizations.id`
 * and `teamId` → `tenancy_teams.id`.
 *
 * @param tableName - The DB table name (used for constraint naming)
 * @param t - The table column references from pgTable's extraConfig callback
 * @param options - Optional ON DELETE behavior overrides
 * @returns Array of ForeignKeyBuilder instances to spread into extraConfig
 *
 * @example
 * ```ts
 * // Array-style extraConfig
 * (t) => [
 *   ...tenancyForeignKeys("my_table", t),
 *   ...tenancyIndexes("my_table", t),
 * ]
 *
 * // Object-style extraConfig (destructure by index)
 * (table) => ({
 *   ...existingIndexes,
 *   fkOrg:  tenancyForeignKeys("my_table", table)[0],
 *   fkTeam: tenancyForeignKeys("my_table", table)[1],
 * })
 * ```
 */
export function tenancyForeignKeys(
  tableName: string,
  t: {
    organizationId?: AnyPgColumn;
    teamId?: AnyPgColumn;
  },
  options: TenancyForeignKeysOptions = {},
): ForeignKeyBuilder[] {
  const { onDeleteOrg = "set null", onDeleteTeam = "set null" } = options;
  const fks: ForeignKeyBuilder[] = [];

  if (t.organizationId) {
    fks.push(
      foreignKey({
        name: `fk_${tableName}_organization`,
        columns: [t.organizationId],
        foreignColumns: [tenancyOrganizations.id],
      }).onDelete(onDeleteOrg),
    );
  }

  if (t.teamId) {
    fks.push(
      foreignKey({
        name: `fk_${tableName}_team`,
        columns: [t.teamId],
        foreignColumns: [tenancyTeams.id],
      }).onDelete(onDeleteTeam),
    );
  }

  return fks;
}
