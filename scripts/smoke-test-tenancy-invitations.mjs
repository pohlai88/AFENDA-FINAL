#!/usr/bin/env node
/**
 * Phase 3 Smoke Test - Tenancy Invitation System
 * Verifies invitation database schema, service layer, and email configuration
 */

import { config } from 'dotenv';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');

// Load .env from app directory (where the actual .env is)
config({ path: join(rootDir, 'app', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function runInvitationSmokeTests() {
  const sql = postgres(DATABASE_URL, { max: 1 });
  
  console.log('🧪 Phase 3 Smoke Test - Tenancy Invitation System\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test 1: Verify tenancy tables exist
    console.log('📊 Test 1: Tenancy Database Tables');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'tenancy_%'
      ORDER BY table_name
    `;
    
    const tableNames = tables.map(t => t.table_name);
    const expectedTables = [
      'tenancy_organizations',
      'tenancy_teams',
      'tenancy_memberships',
      'tenancy_invitations',
      'tenancy_audit_logs'
    ];
    
    const allTablesExist = expectedTables.every(t => tableNames.includes(t));
    
    if (allTablesExist) {
      console.log('✅ All tenancy tables exist');
      tableNames.forEach(t => console.log(`   ✓ ${t}`));
      testsPassed++;
    } else {
      console.log('❌ Missing tenancy tables');
      expectedTables.forEach(t => {
        if (!tableNames.includes(t)) {
          console.log(`   ✗ ${t} - MISSING`);
        }
      });
      testsFailed++;
    }
    
    // Test 2: Verify invitation table schema
    console.log('\n📋 Test 2: Invitation Table Schema');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tenancy_invitations'
      ORDER BY ordinal_position
    `;
    
    const expectedColumns = [
      'id', 'token', 'email', 'organization_id', 'team_id', 
      'role', 'status', 'message', 'invited_by', 'accepted_by',
      'expires_at', 'accepted_at', 'created_at', 'updated_at'
    ];
    
    const columnNames = columns.map(c => c.column_name);
    const allColumnsExist = expectedColumns.every(c => columnNames.includes(c));
    
    if (allColumnsExist) {
      console.log(`✅ All ${expectedColumns.length} columns exist`);
      testsPassed++;
    } else {
      console.log('❌ Missing columns');
      testsFailed++;
    }
    
    // Test 3: Verify indexes on invitations table
    console.log('\n📇 Test 3: Invitation Table Indexes');
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'tenancy_invitations'
      ORDER BY indexname
    `;
    
    const indexCount = indexes.length;
    console.log(`   Found ${indexCount} indexes:`);
    indexes.forEach(idx => console.log(`   ✓ ${idx.indexname}`));
    
    if (indexCount >= 7) {
      console.log('✅ Required indexes created');
      testsPassed++;
    } else {
      console.log(`⚠️  Expected 7+ indexes, found ${indexCount}`);
      testsFailed++;
    }
    
    // Test 4: Check for unique constraint on pending invitations
    console.log('\n🔒 Test 4: Unique Constraint');
    const constraints = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'tenancy_invitations'
      AND constraint_type = 'UNIQUE'
    `;
    
    if (constraints.length > 0) {
      console.log('✅ Unique constraint exists');
      constraints.forEach(c => console.log(`   ✓ ${c.constraint_name}`));
      testsPassed++;
    } else {
      console.log('⚠️  No unique constraint found');
      testsFailed++;
    }
    
    // Test 5: Test invitation CRUD operations
    console.log('\n📝 Test 5: Invitation CRUD Operations');
    
    try {
      // Create test organization first
      const testOrgId = `test-org-${Date.now()}`;
      const testUserId = `test-user-${Date.now()}`;
      
      await sql`
        INSERT INTO tenancy_organizations (id, name, slug, created_by)
        VALUES (${testOrgId}, 'Test Org', ${testOrgId}, ${testUserId})
      `;
      
      // Create invitation
      const testInvitationId = crypto.randomUUID();
      const testToken = Buffer.from(crypto.randomUUID()).toString('base64url');
      const testEmail = `test-${Date.now()}@example.com`;
      
      await sql`
        INSERT INTO tenancy_invitations (
          id, token, email, organization_id, role, status, invited_by, expires_at
        ) VALUES (
          ${testInvitationId},
          ${testToken},
          ${testEmail},
          ${testOrgId},
          'member',
          'pending',
          ${testUserId},
          NOW() + INTERVAL '7 days'
        )
      `;
      console.log('   ✓ Created invitation');
      
      // Read invitation
      const invitations = await sql`
        SELECT * FROM tenancy_invitations WHERE id = ${testInvitationId}
      `;
      
      if (invitations.length === 1) {
        console.log('   ✓ Retrieved invitation');
      } else {
        console.log('   ✗ Failed to retrieve invitation');
        testsFailed++;
      }
      
      // Update invitation
      await sql`
        UPDATE tenancy_invitations 
        SET status = 'accepted'
        WHERE id = ${testInvitationId}
      `;
      console.log('   ✓ Updated invitation');
      
      // Cleanup
      await sql`DELETE FROM tenancy_invitations WHERE id = ${testInvitationId}`;
      await sql`DELETE FROM tenancy_organizations WHERE id = ${testOrgId}`;
      console.log('   ✓ Deleted test data');
      
      console.log('✅ CRUD operations successful');
      testsPassed++;
      
    } catch (error) {
      console.log('❌ CRUD operations failed:', error.message);
      testsFailed++;
    }
    
    // Test 6: Email configuration
    console.log('\n📧 Test 6: Email Configuration');
    
    if (RESEND_API_KEY) {
      console.log('✅ RESEND_API_KEY configured');
      console.log(`   Key: ${RESEND_API_KEY.substring(0, 10)}...`);
      testsPassed++;
    } else {
      console.log('❌ RESEND_API_KEY not set');
      testsFailed++;
    }
    
    if (DEFAULT_FROM_EMAIL) {
      console.log('✅ DEFAULT_FROM_EMAIL configured');
      console.log(`   Email: ${DEFAULT_FROM_EMAIL}`);
      testsPassed++;
    } else {
      console.log('⚠️  DEFAULT_FROM_EMAIL not set (will use default)');
    }
    
    // Test 7: Check existing data
    console.log('\n📈 Test 7: Current Data Status');
    
    const orgCount = await sql`SELECT COUNT(*) as count FROM tenancy_organizations`;
    console.log(`   Organizations: ${orgCount[0].count}`);
    
    const teamCount = await sql`SELECT COUNT(*) as count FROM tenancy_teams`;
    console.log(`   Teams: ${teamCount[0].count}`);
    
    const memberCount = await sql`SELECT COUNT(*) as count FROM tenancy_memberships`;
    console.log(`   Memberships: ${memberCount[0].count}`);
    
    const invitationCount = await sql`SELECT COUNT(*) as count FROM tenancy_invitations`;
    console.log(`   Invitations: ${invitationCount[0].count}`);
    
    const pendingCount = await sql`
      SELECT COUNT(*) as count 
      FROM tenancy_invitations 
      WHERE status = 'pending'
    `;
    console.log(`   Pending invitations: ${pendingCount[0].count}`);
    
    const expiredCount = await sql`
      SELECT COUNT(*) as count 
      FROM tenancy_invitations 
      WHERE status = 'pending' AND expires_at < NOW()
    `;
    console.log(`   Expired invitations: ${expiredCount[0].count}`);
    
    testsPassed++;
    
    // Test 8: Verify audit logging table
    console.log('\n📝 Test 8: Audit Logging');
    const auditCount = await sql`SELECT COUNT(*) as count FROM tenancy_audit_logs`;
    console.log(`   Audit logs: ${auditCount[0].count}`);
    
    if (auditCount[0].count >= 0) {
      console.log('✅ Audit logging table accessible');
      testsPassed++;
    } else {
      console.log('❌ Audit logging table error');
      testsFailed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('='.repeat(60));
    
    if (testsFailed === 0) {
      console.log('\n✅ All Smoke Tests Passed!\n');
      console.log('📋 Next Steps:');
      console.log('1. Start dev server: pnpm dev');
      console.log('2. Navigate to an organization members page');
      console.log('3. Click "Invite Member" button');
      console.log('4. Enter email address and role');
      console.log('5. Check email inbox for invitation');
      console.log('6. Click invitation link to test acceptance flow');
      console.log('\n🔧 API Endpoints to test:');
      console.log('   GET  /api/tenancy/organizations/[id]/invitations/bff');
      console.log('   POST /api/tenancy/organizations/[id]/invitations/bff');
      console.log('   GET  /api/tenancy/invitations/[token]/accept/bff');
      console.log('   POST /api/tenancy/invitations/[token]/accept/bff');
      console.log('\n📁 Frontend Pages:');
      console.log('   /tenancy/organizations/[id]/members (invite dialog)');
      console.log('   /tenancy/invitations/[token] (acceptance page)');
      console.log('');
    } else {
      console.log('\n❌ Some tests failed. Please review errors above.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Smoke test crashed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runInvitationSmokeTests();
