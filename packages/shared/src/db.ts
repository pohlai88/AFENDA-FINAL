/**
 * Unified db + schema export for consumers that need both.
 * Use @afenda/shared/db for db instance and schema tables.
 */

export { db, getDb, getDbClient, type Database } from "./server/db";
export * from "./drizzle";
