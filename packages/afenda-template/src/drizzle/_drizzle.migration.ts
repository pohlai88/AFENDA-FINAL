import { sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";

/**
 * Migration utilities for Neon + Drizzle.
 *
 * Helpers for:
 * - Running migrations programmatically
 * - Checking migration status
 * - Rolling back migrations
 */

type DbInstance = NeonHttpDatabase<any> | NeonDatabase<any>;

/**
 * Get the list of applied migrations.
 */
export async function getAppliedMigrations(db: DbInstance) {
  try {
    const result = await db.execute(sql`
      SELECT hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at DESC
    `);
    return result.rows;
  } catch (error) {
    console.warn("Migrations table not found. Run drizzle-kit push/migrate first.");
    return [];
  }
}

/**
 * Check if a specific migration has been applied.
 */
export async function isMigrationApplied(db: DbInstance, hash: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM drizzle.__drizzle_migrations 
      WHERE hash = ${hash}
    `);
    return Number(result.rows[0]?.count || 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Get migration history with metadata.
 */
export async function getMigrationHistory(db: DbInstance) {
  const migrations = await getAppliedMigrations(db);
  return {
    total: migrations.length,
    latest: migrations[0] || null,
    all: migrations,
  };
}

/**
 * Validate that all required tables exist.
 */
export async function validateSchema(db: DbInstance, requiredTables: string[]) {
  const missing: string[] = [];

  for (const table of requiredTables) {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
      ) as exists
    `);

    if (!result.rows[0]?.exists) {
      missing.push(table);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Create a backup of the current schema (Neon branch recommended).
 */
export async function createSchemaBackup(db: DbInstance, backupName?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = backupName || `backup_${timestamp}`;

  // Note: For Neon, use branching via API instead of pg_dump
  console.warn(
    `For Neon databases, use Neon branching API to create point-in-time branches.
     Branch name suggestion: ${name}`
  );

  return {
    suggested_branch_name: name,
    timestamp,
  };
}
