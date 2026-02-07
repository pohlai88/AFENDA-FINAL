/**
 * Database connection singleton.
 * Uses Neon serverless driver with Drizzle ORM.
 *
 * @example
 * import { db } from "@afenda/shared/server/db";
 * const users = await db.select().from(schema.users);
 */

import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../drizzle";

/**
 * Create a Neon HTTP client.
 * Uses DATABASE_URL from environment.
 */
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required. Set it in your .env file.");
  }
  return neon(url);
}

const _client = createClient();

/**
 * Drizzle database instance.
 * Pre-configured with all schemas for type-safe queries.
 *
 * Note: drizzle-orm v0.30+ with @neondatabase/serverless v1.0+
 * requires the { client: sql } syntax.
 */
export const db = drizzle({
  client: _client,
  schema,
  logger: process.env.NODE_ENV === "development",
});

/** Returns the db instance (alias for compatibility). */
export const getDb = () => db;

/** Returns the raw Neon client for tagged template SQL (full-text search, raw JSONB, etc). */
export const getDbClient = () => _client;

/**
 * Type alias for the database instance.
 */
export type Database = typeof db;
