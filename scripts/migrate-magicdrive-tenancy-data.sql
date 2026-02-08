-- Data Migration: Populate MagicDrive organizationId from legacyTenantId
-- Post-migration script for 0015_magicdrive_tenancy_integration.sql
--
-- This script populates organization_id based on legacy_tenant_id values
-- 
-- Strategy Options:
--   A. If legacy tenants map 1:1 to organizations: Direct mapping
--   B. If legacy tenants are user-based: Map to personal workspace (organizationId = NULL)
--   C. Custom mapping: Update with specific logic based on business rules

-- ============================================================================
-- DIAGNOSTIC: Check current state
-- ============================================================================

-- Check records with legacy_tenant_id but NULL organization_id
SELECT 
  'magicdrive_objects' as table_name,
  COUNT(*) as records_with_legacy_tenant,
  COUNT(DISTINCT legacy_tenant_id) as unique_legacy_tenants,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as already_migrated
FROM magicdrive_objects 
WHERE legacy_tenant_id IS NOT NULL;

SELECT 
  'magicdrive_uploads' as table_name,
  COUNT(*) as records_with_legacy_tenant,
  COUNT(DISTINCT legacy_tenant_id) as unique_legacy_tenants,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as already_migrated
FROM magicdrive_uploads 
WHERE legacy_tenant_id IS NOT NULL;

SELECT 
  'magicdrive_duplicate_groups' as table_name,
  COUNT(*) as records_with_legacy_tenant,
  COUNT(DISTINCT legacy_tenant_id) as unique_legacy_tenants,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as already_migrated
FROM magicdrive_duplicate_groups 
WHERE legacy_tenant_id IS NOT NULL;

-- Check available organizations
SELECT 
  id,
  name,
  slug,
  created_at
FROM tenancy_organizations
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STRATEGY A: Clear legacy data (recommended for fresh installations)
-- ============================================================================
-- If this is a fresh installation without production data, simply set
-- legacy_tenant_id to NULL (meaning personal workspace)

-- UNCOMMENT to execute:
-- UPDATE magicdrive_objects 
-- SET legacy_tenant_id = NULL, organization_id = NULL, team_id = NULL
-- WHERE legacy_tenant_id IS NOT NULL;

-- UPDATE magicdrive_uploads 
-- SET legacy_tenant_id = NULL, organization_id = NULL, team_id = NULL
-- WHERE legacy_tenant_id IS NOT NULL;

-- UPDATE magicdrive_duplicate_groups 
-- SET legacy_tenant_id = NULL, organization_id = NULL, team_id = NULL
-- WHERE legacy_tenant_id IS NOT NULL;


-- ============================================================================
-- STRATEGY B: Map to default organization (if exists)
-- ============================================================================
-- If you have a default/demo organization, map all legacy data to it

-- UNCOMMENT and replace <ORG_ID> with actual organization ID:
-- UPDATE magicdrive_objects 
-- SET organization_id = '<ORG_ID>', team_id = NULL
-- WHERE legacy_tenant_id IS NOT NULL AND organization_id IS NULL;

-- UPDATE magicdrive_uploads 
-- SET organization_id = '<ORG_ID>', team_id = NULL
-- WHERE legacy_tenant_id IS NOT NULL AND organization_id IS NULL;

-- UPDATE magicdrive_duplicate_groups 
-- SET organization_id = '<ORG_ID>', team_id = NULL
-- WHERE legacy_tenant_id IS NOT NULL AND organization_id IS NULL;


-- ============================================================================
-- STRATEGY C: Custom 1:1 mapping (if legacy tenant_id = organization_id)
-- ============================================================================
-- If your legacy tenant IDs happen to match organization IDs

-- UNCOMMENT to execute (VERIFY FIRST):
-- UPDATE magicdrive_objects 
-- SET organization_id = legacy_tenant_id
-- WHERE legacy_tenant_id IS NOT NULL 
--   AND organization_id IS NULL
--   AND legacy_tenant_id IN (SELECT id FROM tenancy_organizations);

-- UPDATE magicdrive_uploads 
-- SET organization_id = legacy_tenant_id
-- WHERE legacy_tenant_id IS NOT NULL 
--   AND organization_id IS NULL
--   AND legacy_tenant_id IN (SELECT id FROM tenancy_organizations);

-- UPDATE magicdrive_duplicate_groups 
-- SET organization_id = legacy_tenant_id
-- WHERE legacy_tenant_id IS NOT NULL 
--   AND organization_id IS NULL
--   AND legacy_tenant_id IN (SELECT id FROM tenancy_organizations);


-- ============================================================================
-- VERIFICATION: Check migration results
-- ============================================================================

SELECT 
  'magicdrive_objects' as table_name,
  COUNT(*) FILTER (WHERE legacy_tenant_id IS NOT NULL AND organization_id IS NULL) as unmigrated_records,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as migrated_to_org,
  COUNT(*) FILTER (WHERE organization_id IS NULL AND legacy_tenant_id IS NULL) as personal_workspace
FROM magicdrive_objects;

SELECT 
  'magicdrive_uploads' as table_name,
  COUNT(*) FILTER (WHERE legacy_tenant_id IS NOT NULL AND organization_id IS NULL) as unmigrated_records,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as migrated_to_org,
  COUNT(*) FILTER (WHERE organization_id IS NULL AND legacy_tenant_id IS NULL) as personal_workspace
FROM magicdrive_uploads;

SELECT 
  'magicdrive_duplicate_groups' as table_name,
  COUNT(*) FILTER (WHERE legacy_tenant_id IS NOT NULL AND organization_id IS NULL) as unmigrated_records,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as migrated_to_org,
  COUNT(*) FILTER (WHERE organization_id IS NULL AND legacy_tenant_id IS NULL) as personal_workspace
FROM magicdrive_duplicate_groups;

-- If unmigrated_records > 0, review and apply appropriate strategy above
