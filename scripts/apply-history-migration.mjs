#!/usr/bin/env node
/**
 * Apply history tables migration
 * Applies only the new history tables (0001_cute_snowbird.sql)
 */

import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { config } from 'dotenv';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');

// Load .env file from project root
config({ path: join(rootDir, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable not set');
  console.error('');
  console.error('Please ensure .env file exists in project root with:');
  console.error('DATABASE_URL=postgresql://user:password@host:port/database');
  console.error('');
  process.exit(1);
}

async function applyMigration() {
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log('🔄 Applying history tables migration...');

    const migrationPath = resolve(__dirname, '..', 'drizzle', '0001_cute_snowbird.sql');
    const migrationSQL = await readFile(migrationPath, 'utf-8');

    await sql.unsafe(migrationSQL);

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('📊 New tables created:');
    console.log('  ✓ orchestra_config_history');
    console.log('  ✓ orchestra_health_history');
    console.log('  ✓ orchestra_backup_schedule');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
