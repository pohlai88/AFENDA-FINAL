/**
 * Unified db + schema export for consumers that need both.
 * Use `@afenda/shared/db` for db instance and schema tables.
 *
 * @domain shared
 * @layer server
 */

export { db, getDb, getDbClient, type Database } from "./server/db";
export * from "./drizzle";
