#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs SQL migration files against the database
 * 
 * Usage:
 *   node scripts/run-migration.mjs 001-add-history-tables.sql
 *   pnpm migrate 001-add-history-tables.sql
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Get migration file from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Migration file required');
  console.error('Usage: node scripts/run-migration.mjs <migration-file>');
  console.error('Example: node scripts/run-migration.mjs 001-add-history-tables.sql');
  process.exit(1);
}

// Database connection from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable not set');
  console.error('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

async function runMigration() {
  const sql = postgres(DATABASE_URL, {
    max: 1,
    onnotice: (notice) => {
      console.log('📢', notice.message);
    },
  });

  try {
    console.log('🔄 Running migration:', migrationFile);
    console.log('📂 Database:', DATABASE_URL.split('@')[1]?.split('/')[1] || 'unknown');
    console.log('');

    // Read migration file
    const migrationPath = resolve(__dirname, 'migrations', migrationFile);
    const migrationSQL = await readFile(migrationPath, 'utf-8');

    console.log('📝 Migration file loaded:', migrationPath);
    console.log('📏 SQL size:', migrationSQL.length, 'characters');
    console.log('');

    // Execute migration
    console.log('⚡ Executing migration...');
    await sql.unsafe(migrationSQL);

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'orchestra_%'
      ORDER BY table_name
    `;

    console.log('📊 Orchestra tables in database:');
    tables.forEach(({ table_name }) => {
      console.log('  ✓', table_name);
    });

    console.log('');
    console.log('🎉 Migration complete! You can now:');
    console.log('  1. Update Drizzle schema: packages/orchestra/src/drizzle/orchestra.schema.ts');
    console.log('  2. Generate TypeScript types: pnpm drizzle-kit generate');
    console.log('  3. Start implementing Phase 1 features');

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed!');
    console.error('');
    console.error('Error:', error.message);

    if (error.position) {
      console.error('Position:', error.position);
    }

    if (error.detail) {
      console.error('Detail:', error.detail);
    }

    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('  - Check DATABASE_URL is correct');
    console.error('  - Ensure database is running');
    console.error('  - Verify parent tables exist (orchestra_admin_config, orchestra_service_registry)');
    console.error('  - Check migration SQL syntax');

    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
