#!/usr/bin/env node
/**
 * Phase 1 Smoke Test
 * Verifies database migration and basic functionality
 */

import { config } from 'dotenv';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');

// Load .env
config({ path: join(rootDir, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function runSmokeTests() {
  const sql = postgres(DATABASE_URL, { max: 1 });
  
  console.log('🧪 Phase 1 Smoke Test\n');
  
  try {
    // Test 1: Verify tables exist
    console.log('📊 Test 1: Database Tables');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'orchestra_%'
      ORDER BY table_name
    `;
    
    const tableNames = tables.map(t => t.table_name);
    const expectedTables = [
      'orchestra_admin_config',
      'orchestra_audit_log',
      'orchestra_backup_schedule',
      'orchestra_config_history',
      'orchestra_health_history',
      'orchestra_service_registry'
    ];
    
    const allTablesExist = expectedTables.every(t => tableNames.includes(t));
    
    if (allTablesExist) {
      console.log('✅ All 6 tables exist');
      tableNames.forEach(t => console.log(`   ✓ ${t}`));
    } else {
      console.log('❌ Missing tables');
      expectedTables.forEach(t => {
        if (!tableNames.includes(t)) {
          console.log(`   ✗ ${t} - MISSING`);
        }
      });
    }
    
    // Test 2: Verify indexes
    console.log('\n📇 Test 2: Database Indexes');
    const indexes = await sql`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND (tablename LIKE 'orchestra_%history' OR tablename = 'orchestra_backup_schedule')
    `;
    
    const indexCount = parseInt(indexes[0].count);
    if (indexCount >= 10) {
      console.log(`✅ History table indexes created (${indexCount} indexes)`);
    } else {
      console.log(`⚠️  Expected 10+ indexes, found ${indexCount}`);
    }
    
    // Test 3: Test write to config_history
    console.log('\n📝 Test 3: Config History Write');
    try {
      await sql`
        INSERT INTO orchestra_config_history (config_key, old_value, new_value, changed_by)
        VALUES ('smoke.test', '{"test": "old"}', '{"test": "new"}', 'smoke_test')
      `;
      console.log('✅ Config history write successful');
      
      // Cleanup
      await sql`DELETE FROM orchestra_config_history WHERE config_key = 'smoke.test'`;
    } catch (error) {
      console.log('❌ Config history write failed:', error.message);
    }
    
    // Test 4: Test write to health_history
    console.log('\n💚 Test 4: Health History Write');
    try {
      await sql`
        INSERT INTO orchestra_health_history (service_id, status, latency_ms)
        VALUES ('smoke-test-service', 'healthy', 100)
      `;
      console.log('✅ Health history write successful');
      
      // Cleanup
      await sql`DELETE FROM orchestra_health_history WHERE service_id = 'smoke-test-service'`;
    } catch (error) {
      console.log('❌ Health history write failed:', error.message);
    }
    
    // Test 5: Check existing data
    console.log('\n📈 Test 5: Data Status');
    
    const configCount = await sql`SELECT COUNT(*) as count FROM orchestra_admin_config`;
    console.log(`   Configs: ${configCount[0].count}`);
    
    const serviceCount = await sql`SELECT COUNT(*) as count FROM orchestra_service_registry`;
    console.log(`   Services: ${serviceCount[0].count}`);
    
    const auditCount = await sql`SELECT COUNT(*) as count FROM orchestra_audit_log`;
    console.log(`   Audit logs: ${auditCount[0].count}`);
    
    const healthHistoryCount = await sql`SELECT COUNT(*) as count FROM orchestra_health_history`;
    console.log(`   Health history: ${healthHistoryCount[0].count}`);
    
    const configHistoryCount = await sql`SELECT COUNT(*) as count FROM orchestra_config_history`;
    console.log(`   Config history: ${configHistoryCount[0].count}`);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Smoke Test Complete');
    console.log('='.repeat(50));
    console.log('\n📋 Next Steps:');
    console.log('1. Start dev server: pnpm dev');
    console.log('2. Visit: http://localhost:3000/app/admin/config');
    console.log('3. Test template quick-apply button');
    console.log('4. Visit: http://localhost:3000/app/admin/health');
    console.log('5. Verify health polling (check Network tab)');
    console.log('\n📖 Full testing guide: .dev-note/PHASE1-TESTING.md\n');
    
  } catch (error) {
    console.error('\n❌ Smoke test failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runSmokeTests();
