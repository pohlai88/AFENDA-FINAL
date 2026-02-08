#!/usr/bin/env node
/**
 * MagicDrive Tenancy Data Migration Script
 * Post-migration for 0015_magicdrive_tenancy_integration.sql
 * 
 * This script helps migrate legacy tenant_id values to the new organization_id structure
 */

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import nextEnv from "@next/env"
import { sql } from "drizzle-orm"

const { loadEnvConfig } = nextEnv

// Load environment variables
loadEnvConfig(process.cwd())

const DATABASE_URL = process.env.DATABASE_URL_MIGRATIONS || process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL or DATABASE_URL_MIGRATIONS not found in environment")
  process.exit(1)
}

const client = postgres(DATABASE_URL)
const db = drizzle(client)

async function runDiagnostic() {
  console.log("\\n📊 Running diagnostic...")
  console.log("━".repeat(80))

  // Check magicdrive_objects
  const objectsStats = await db.execute(sql`
    SELECT 
      COUNT(*) as total_records,
      COUNT(*) FILTER (WHERE legacy_tenant_id IS NOT NULL) as records_with_legacy_tenant,
      COUNT(DISTINCT legacy_tenant_id) FILTER (WHERE legacy_tenant_id IS NOT NULL) as unique_legacy_tenants,
      COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as already_migrated,
      COUNT(*) FILTER (WHERE organization_id IS NULL AND legacy_tenant_id IS NULL) as personal_workspace
    FROM magicdrive_objects
  `)
  
  const uploadsStats = await db.execute(sql`
    SELECT 
      COUNT(*) as total_records,
      COUNT(*) FILTER (WHERE legacy_tenant_id IS NOT NULL) as records_with_legacy_tenant,
      COUNT(DISTINCT legacy_tenant_id) FILTER (WHERE legacy_tenant_id IS NOT NULL) as unique_legacy_tenants,
      COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as already_migrated,
      COUNT(*) FILTER (WHERE organization_id IS NULL AND legacy_tenant_id IS NULL) as personal_workspace
    FROM magicdrive_uploads
  `)
  
  const duplicateGroupsStats = await db.execute(sql`
    SELECT 
      COUNT(*) as total_records,
      COUNT(*) FILTER (WHERE legacy_tenant_id IS NOT NULL) as records_with_legacy_tenant,
      COUNT(DISTINCT legacy_tenant_id) FILTER (WHERE legacy_tenant_id IS NOT NULL) as unique_legacy_tenants,
      COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as already_migrated,
      COUNT(*) FILTER (WHERE organization_id IS NULL AND legacy_tenant_id IS NULL) as personal_workspace
    FROM magicdrive_duplicate_groups
  `)

  console.log("\\n📁 magicdrive_objects:")
  console.table(objectsStats.rows[0])
  
  console.log("\\n📤 magicdrive_uploads:")
  console.table(uploadsStats.rows[0])
  
  console.log("\\n🔄 magicdrive_duplicate_groups:")
  console.table(duplicateGroupsStats.rows[0])

  // Check available organizations
  const orgs = await db.execute(sql`
    SELECT id, name, slug, created_at
    FROM tenancy_organizations
    ORDER BY created_at DESC
    LIMIT 10
  `)

  console.log("\\n🏢 Available Organizations:")
  if (orgs.rows.length === 0) {
    console.log("   No organizations found")
  } else {
    console.table(orgs.rows)
  }

  const totalLegacyRecords = 
    Number(objectsStats.rows[0].records_with_legacy_tenant) +
    Number(uploadsStats.rows[0].records_with_legacy_tenant) +
    Number(duplicateGroupsStats.rows[0].records_with_legacy_tenant)

  return { totalLegacyRecords, orgs: orgs.rows }
}

async function clearLegacyData() {
  console.log("\\n🧹 Clearing legacy tenant data (Strategy A)...")
  
  const result1 = await db.execute(sql`
    UPDATE magicdrive_objects 
    SET legacy_tenant_id = NULL, organization_id = NULL, team_id = NULL
    WHERE legacy_tenant_id IS NOT NULL
  `)
  
  const result2 = await db.execute(sql`
    UPDATE magicdrive_uploads 
    SET legacy_tenant_id = NULL, organization_id = NULL, team_id = NULL
    WHERE legacy_tenant_id IS NOT NULL
  `)
  
  const result3 = await db.execute(sql`
    UPDATE magicdrive_duplicate_groups 
    SET legacy_tenant_id = NULL, organization_id = NULL, team_id = NULL
    WHERE legacy_tenant_id IS NOT NULL
  `)

  console.log(`✅ Updated ${result1.count} objects`)
  console.log(`✅ Updated ${result2.count} uploads`)
  console.log(`✅ Updated ${result3.count} duplicate groups`)
  console.log("\\n✨ Legacy data cleared. All records set to personal workspace.")
}

async function mapToDefaultOrg(orgId) {
  console.log(`\\n🏢 Mapping legacy data to organization: ${orgId}...`)
  
  const result1 = await db.execute(sql`
    UPDATE magicdrive_objects 
    SET organization_id = ${orgId}, team_id = NULL
    WHERE legacy_tenant_id IS NOT NULL AND organization_id IS NULL
  `)
  
  const result2 = await db.execute(sql`
    UPDATE magicdrive_uploads 
    SET organization_id = ${orgId}, team_id = NULL
   WHERE legacy_tenant_id IS NOT NULL AND organization_id IS NULL
  `)
  
  const result3 = await db.execute(sql`
    UPDATE magicdrive_duplicate_groups 
    SET organization_id = ${orgId}, team_id = NULL
    WHERE legacy_tenant_id IS NOT NULL AND organization_id IS NULL
  `)

  console.log(`✅ Updated ${result1.count} objects`)
  console.log(`✅ Updated ${result2.count} uploads`)
  console.log(`✅ Updated ${result3.count} duplicate groups`)
  console.log(`\\n✨ Legacy data mapped to organization ${orgId}`)
}

async function main() {
  console.log("\\n" + "=".repeat(80))
  console.log("  MagicDrive Tenancy Data Migration")
  console.log("=".repeat(80))

  try {
    const { totalLegacyRecords, orgs } = await runDiagnostic()

    if (totalLegacyRecords === 0) {
      console.log("\\n✅ No legacy data to migrate. Migration complete!")
      await client.end()
      return
    }

    console.log("\\n" + "━".repeat(80))
    console.log(`⚠️  Found ${totalLegacyRecords} records with legacy tenant IDs`)
    console.log("\\nRecommended Strategy:")
    
    if (orgs.length === 0) {
      console.log("  → Strategy A: Clear legacy data (no organizations exist)")
      console.log("\\n  This will set all records to personal workspace (organizationId = NULL)")
      console.log("  Executing in 3 seconds... (Ctrl+C to cancel)")
      await new Promise(resolve => setTimeout(resolve, 3000))
      await clearLegacyData()
    } else {
      console.log("  → Strategy B: Map to first organization (recommended)")
      console.log(`\\n  This will map all legacy data to: ${orgs[0].name} (${orgs[0].id})`)
      console.log("  Executing in 3 seconds... (Ctrl+C to cancel)")
      await new Promise(resolve => setTimeout(resolve, 3000))
      await mapToDefaultOrg(orgs[0].id)
    }

    // Verify migration
    console.log("\\n\\n" + "━".repeat(80))
    await runDiagnostic()
    
    console.log("\\n✅ Data migration complete!")
    console.log("=".repeat(80) + "\\n")

  } catch (error) {
    console.error("\\n❌ Migration failed:", error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
