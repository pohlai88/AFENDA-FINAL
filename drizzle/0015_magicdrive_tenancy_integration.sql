-- Migration: MagicDrive Tenancy Integration
-- Phase 4, Step 4.2: Add proper tenancy relationships to MagicDrive
-- 
-- Changes:
-- 1. Add organizationId and teamId columns to all MagicDrive tables
-- 2. Rename tenantId → legacyTenantId (backward compatibility)
-- 3. Add foreign key constraints to tenancy_organizations and tenancy_teams
-- 4. Add indexes for org/team-scoped queries
--
-- IMPORTANT: This migration preserves existing data by renaming tenantId.
-- Post-migration migration data script needed to populate organizationId from legacyTenantId.

-- ============================================================================
-- OBJECTS (DOCUMENTS) TABLE
-- ============================================================================

-- Rename existing tenantId column (preserve data)
ALTER TABLE magicdrive_objects 
  RENAME COLUMN tenant_id TO legacy_tenant_id;

-- Add new tenancy columns
ALTER TABLE magicdrive_objects 
  ADD COLUMN organization_id TEXT,
  ADD COLUMN team_id TEXT;

-- Add foreign key constraints
ALTER TABLE magicdrive_objects 
  ADD CONSTRAINT fk_magicdrive_objects_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magicdrive_objects 
  ADD CONSTRAINT fk_magicdrive_objects_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

-- Add indexes
CREATE INDEX idx_magicdrive_objects_organization_id 
  ON magicdrive_objects(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_magicdrive_objects_team_id 
  ON magicdrive_objects(team_id) 
  WHERE team_id IS NOT NULL;

-- Composite index for org + status queries (common pattern)
CREATE INDEX idx_magicdrive_objects_org_status 
  ON magicdrive_objects(organization_id, status) 
  WHERE organization_id IS NOT NULL;

-- Composite index for team + status queries
CREATE INDEX idx_magicdrive_objects_team_status 
  ON magicdrive_objects(team_id, status) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- UPLOADS TABLE
-- ============================================================================

ALTER TABLE magicdrive_uploads 
  RENAME COLUMN tenant_id TO legacy_tenant_id;

ALTER TABLE magicdrive_uploads 
  ADD COLUMN organization_id TEXT,
  ADD COLUMN team_id TEXT;

ALTER TABLE magicdrive_uploads 
  ADD CONSTRAINT fk_magicdrive_uploads_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magicdrive_uploads 
  ADD CONSTRAINT fk_magicdrive_uploads_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX idx_magicdrive_uploads_organization_id 
  ON magicdrive_uploads(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_magicdrive_uploads_team_id 
  ON magicdrive_uploads(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- DUPLICATE GROUPS TABLE
-- ============================================================================

ALTER TABLE magicdrive_duplicate_groups 
  RENAME COLUMN tenant_id TO legacy_tenant_id;

ALTER TABLE magicdrive_duplicate_groups 
  ADD COLUMN organization_id TEXT,
  ADD COLUMN team_id TEXT;

ALTER TABLE magicdrive_duplicate_groups 
  ADD CONSTRAINT fk_magicdrive_duplicate_groups_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magicdrive_duplicate_groups 
  ADD CONSTRAINT fk_magicdrive_duplicate_groups_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX idx_magicdrive_duplicate_groups_organization_id 
  ON magicdrive_duplicate_groups(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_magicdrive_duplicate_groups_team_id 
  ON magicdrive_duplicate_groups(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- TAGS TABLE
-- ============================================================================

ALTER TABLE magicdrive_tags 
  RENAME COLUMN tenant_id TO legacy_tenant_id;

ALTER TABLE magicdrive_tags 
  ADD COLUMN organization_id TEXT,
  ADD COLUMN team_id TEXT;

ALTER TABLE magicdrive_tags 
  ADD CONSTRAINT fk_magicdrive_tags_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magicdrive_tags 
  ADD CONSTRAINT fk_magicdrive_tags_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX idx_magicdrive_tags_organization_id 
  ON magicdrive_tags(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_magicdrive_tags_team_id 
  ON magicdrive_tags(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- SAVED VIEWS TABLE
-- ============================================================================

ALTER TABLE magicdrive_saved_views 
  RENAME COLUMN tenant_id TO legacy_tenant_id;

ALTER TABLE magicdrive_saved_views 
  ADD COLUMN organization_id TEXT,
  ADD COLUMN team_id TEXT;

ALTER TABLE magicdrive_saved_views 
  ADD CONSTRAINT fk_magicdrive_saved_views_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magicdrive_saved_views 
  ADD CONSTRAINT fk_magicdrive_saved_views_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX idx_magicdrive_saved_views_organization_id 
  ON magicdrive_saved_views(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_magicdrive_saved_views_team_id 
  ON magicdrive_saved_views(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================

ALTER TABLE magicdrive_user_preferences 
  RENAME COLUMN tenant_id TO legacy_tenant_id;

ALTER TABLE magicdrive_user_preferences 
  ADD COLUMN organization_id TEXT,
  ADD COLUMN team_id TEXT;

ALTER TABLE magicdrive_user_preferences 
  ADD CONSTRAINT fk_magicdrive_user_preferences_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magicdrive_user_preferences 
  ADD CONSTRAINT fk_magicdrive_user_preferences_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX idx_magicdrive_user_preferences_organization_id 
  ON magicdrive_user_preferences(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_magicdrive_user_preferences_team_id 
  ON magicdrive_user_preferences(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- TENANT SETTINGS TABLE
-- ============================================================================

ALTER TABLE magicdrive_tenant_settings 
  RENAME COLUMN tenant_id TO legacy_tenant_id;

ALTER TABLE magicdrive_tenant_settings 
  ADD COLUMN organization_id TEXT,
  ADD COLUMN team_id TEXT;

ALTER TABLE magicdrive_tenant_settings 
  ADD CONSTRAINT fk_magicdrive_tenant_settings_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE CASCADE;  -- Cascade here since settings are org-specific

-- Note: Team settings would typically cascade as well
ALTER TABLE magicdrive_tenant_settings 
  ADD CONSTRAINT fk_magicdrive_tenant_settings_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE CASCADE;

CREATE INDEX idx_magicdrive_tenant_settings_organization_id 
  ON magicdrive_tenant_settings(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_magicdrive_tenant_settings_team_id 
  ON magicdrive_tenant_settings(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- OBJECT ACL TABLE
-- ============================================================================

ALTER TABLE magicdrive_object_acl 
  RENAME COLUMN tenant_id TO legacy_tenant_id;

ALTER TABLE magicdrive_object_acl 
  ADD COLUMN organization_id TEXT,
  ADD COLUMN team_id TEXT;

ALTER TABLE magicdrive_object_acl 
  ADD CONSTRAINT fk_magicdrive_object_acl_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE CASCADE;

ALTER TABLE magicdrive_object_acl 
  ADD CONSTRAINT fk_magicdrive_object_acl_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE CASCADE;

CREATE INDEX idx_magicdrive_object_acl_organization_id 
  ON magicdrive_object_acl(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_magicdrive_object_acl_team_id 
  ON magicdrive_object_acl(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- DATA MIGRATION SCRIPT (Run after this migration)
-- ============================================================================

-- This migration preserves legacy_tenant_id but does NOT automatically populate
-- organization_id. You'll need a post-migration script to:
-- 1. Map legacy_tenant_id values to actual organization IDs
-- 2. Update organization_id accordingly
--
-- Example (customize based on your tenant mapping logic):
--
-- UPDATE magicdrive_objects 
-- SET organization_id = (
--   SELECT id FROM tenancy_organizations 
--   WHERE slug = magicdrive_objects.legacy_tenant_id 
--   LIMIT 1
-- )
-- WHERE legacy_tenant_id IS NOT NULL;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check foreign key constraints
-- SELECT 
--   conname AS constraint_name,
--   conrelid::regclass AS table_name,
--   confrelid::regclass AS referenced_table
-- FROM pg_constraint
-- WHERE contype = 'f' 
--   AND conname LIKE 'fk_magicdrive_%'
-- ORDER BY conname;

-- Check column renames
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'magicdrive_objects' 
--   AND column_name IN ('legacy_tenant_id', 'organization_id', 'team_id');


-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration:
-- ALTER TABLE magicdrive_objects DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE magicdrive_objects DROP COLUMN IF EXISTS team_id;
-- ALTER TABLE magicdrive_objects RENAME COLUMN legacy_tenant_id TO tenant_id;
-- (repeat for all tables)
