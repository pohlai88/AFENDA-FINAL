/**
 * Magicdrive database instance with merged schema (shared + magicdrive).
 * Use this instead of @afenda/shared/db in magicdrive code to avoid cyclic deps.
 *
 * @layer domain (magicdrive)
 */

import "server-only";

import { drizzle } from "drizzle-orm/neon-http";
import { getDbClient } from "@afenda/shared/server/db";
import * as sharedSchema from "@afenda/shared/drizzle";
import * as magicdriveSchema from "../drizzle";

const schema = { ...sharedSchema, ...magicdriveSchema };

export const db = drizzle({
  client: getDbClient(),
  schema,
  logger: process.env.NODE_ENV === "development",
});

export const getDb = () => db;
export type Database = typeof db;

// Re-export schema so consumers can import { getDb, magicdriveObjects, ... } from here
export * from "@afenda/shared/drizzle";
export * from "../drizzle";
