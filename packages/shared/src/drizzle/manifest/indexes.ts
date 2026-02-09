/**
 * Schema Manifest — Index Factories
 * 
 * Deterministic index naming enforcing INDEX_PREFIX convention.
 * 
 * @see https://orm.drizzle.team/docs/indexes-constraints
 */

import { index, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { INDEX_PREFIX } from "../constants";

/**
 * Standard index with deterministic naming
 * Pattern: idx_{tableName}_{col1}_{col2}
 */
export function idx(tableName: string, ...cols: string[]) {
  const name = `${INDEX_PREFIX}${tableName}_${cols.join("_")}`;
  return index(name);
}

/**
 * Unique index with deterministic naming
 * Pattern: uidx_{tableName}_{col1}_{col2}
 */
export function uidx(tableName: string, ...cols: string[]) {
  const name = `uidx_${tableName}_${cols.join("_")}`;
  return uniqueIndex(name);
}

/**
 * Standard tenant indexes
 * Returns [idx on tenant_id, idx on team_id] array for spreading
 */
export function tenantIndexes(tableName: string, t: { tenantId: AnyPgColumn; teamId?: AnyPgColumn }) {
  const indexes = [
    idx(tableName, "tenant_id").on(t.tenantId),
  ];
  
  if (t.teamId) {
    indexes.push(idx(tableName, "team_id").on(t.teamId));
  }
  
  return indexes;
}

/**
 * User index — for user-scoped tables
 */
export function userIndex(tableName: string, t: { userId: AnyPgColumn }) {
  return idx(tableName, "user_id").on(t.userId);
}

/**
 * Composite tenant + user index — for common query pattern
 */
export function tenantUserIndex(tableName: string, t: { tenantId: AnyPgColumn; userId: AnyPgColumn }) {
  return idx(tableName, "tenant_id_user_id").on(t.tenantId, t.userId);
}
