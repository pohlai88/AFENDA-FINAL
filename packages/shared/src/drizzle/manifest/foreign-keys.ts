/**
 * Schema Manifest — Foreign Key Factories
 * 
 * Standardized FK patterns for tenant relationships.
 * 
 * @see https://orm.drizzle.team/docs/indexes-constraints#foreign-key
 */

import { foreignKey, type AnyPgColumn, type ForeignKeyBuilder } from "drizzle-orm/pg-core";
import { FK_PREFIX, ON_DELETE_DEFAULTS } from "../constants";

/**
 * Foreign key to tenancy_organizations.id
 * Pattern: fk_{tableName}_tenant
 * Default onDelete: "set null" (orphan data, don't destroy)
 */
export function tenantFK(
  tableName: string,
  t: { tenantId: AnyPgColumn },
  opts?: { onDelete?: "cascade" | "set null" | "restrict" | "no action" }
): ForeignKeyBuilder {
  return foreignKey({
    columns: [t.tenantId],
    foreignColumns: [] as unknown as [AnyPgColumn], // Will be bound to tenancyOrganizations.id in schema
    name: `${FK_PREFIX}${tableName}_tenant`,
  }).onDelete(opts?.onDelete ?? ON_DELETE_DEFAULTS.TENANCY);
}

/**
 * Foreign key to tenancy_teams.id
 * Pattern: fk_{tableName}_team
 * Default onDelete: "set null"
 */
export function teamFK(
  tableName: string,
  t: { teamId: AnyPgColumn },
  opts?: { onDelete?: "cascade" | "set null" | "restrict" | "no action" }
): ForeignKeyBuilder {
  return foreignKey({
    columns: [t.teamId],
    foreignColumns: [] as unknown as [AnyPgColumn], // Will be bound to tenancyTeams.id in schema
    name: `${FK_PREFIX}${tableName}_team`,
  }).onDelete(opts?.onDelete ?? ON_DELETE_DEFAULTS.TENANCY);
}

/**
 * Standard tenant FKs combo — returns array for spreading
 * Usage: (t) => [...tenantFKs("table_name", t), ...]
 */
export function tenantFKs(
  tableName: string,
  t: { tenantId: AnyPgColumn; teamId?: AnyPgColumn },
  opts?: {
    onDeleteOrg?: "cascade" | "set null" | "restrict" | "no action";
    onDeleteTeam?: "cascade" | "set null" | "restrict" | "no action";
  }
): ForeignKeyBuilder[] {
  const fks: ForeignKeyBuilder[] = [
    tenantFK(tableName, t as { tenantId: AnyPgColumn }, { onDelete: opts?.onDeleteOrg }),
  ];
  
  if (t.teamId) {
    fks.push(teamFK(tableName, t as { teamId: AnyPgColumn }, { onDelete: opts?.onDeleteTeam }));
  }
  
  return fks;
}
