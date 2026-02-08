-- Migration: Add foreign key constraints for MagicTodo tenancy integration
-- Phase 4, Step 4.1: Enforce data integrity between MagicTodo and Tenancy domains
-- 
-- IMPORTANT: This migration will FAIL if orphan records exist (organizationId/teamId
-- values that don't match existing tenancy_organizations.id or tenancy_teams.id).
-- 
-- Pre-migration cleanup required:
--   1. Audit orphan records: SELECT COUNT(*) FROM magictodo_tasks WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM tenancy_organizations);
--   2. Either fix orphan records (update to valid org) OR set to NULL before running migration
--
-- Cascade behavior: SET NULL on org/team delete (preserves user data)

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

-- Add foreign key constraint for organizationId
ALTER TABLE magictodo_tasks 
  ADD CONSTRAINT fk_magictodo_tasks_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

-- Add foreign key constraint for teamId
ALTER TABLE magictodo_tasks 
  ADD CONSTRAINT fk_magictodo_tasks_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

-- Add index for org-scoped queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_magictodo_tasks_organization_id 
  ON magictodo_tasks(organization_id) 
  WHERE organization_id IS NOT NULL;

-- Add index for team-scoped queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_magictodo_tasks_team_id 
  ON magictodo_tasks(team_id) 
  WHERE team_id IS NOT NULL;

-- Composite index for org + status queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_magictodo_tasks_org_status 
  ON magictodo_tasks(organization_id, status) 
  WHERE organization_id IS NOT NULL;

-- Composite index for team + status queries
CREATE INDEX IF NOT EXISTS idx_magictodo_tasks_team_status 
  ON magictodo_tasks(team_id, status) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

ALTER TABLE magictodo_projects 
  ADD CONSTRAINT fk_magictodo_projects_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magictodo_projects 
  ADD CONSTRAINT fk_magictodo_projects_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_projects_organization_id 
  ON magictodo_projects(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_projects_team_id 
  ON magictodo_projects(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- FOCUS SESSIONS TABLE
-- ============================================================================

ALTER TABLE magictodo_focus_sessions 
  ADD CONSTRAINT fk_magictodo_focus_sessions_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magictodo_focus_sessions 
  ADD CONSTRAINT fk_magictodo_focus_sessions_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_focus_sessions_organization_id 
  ON magictodo_focus_sessions(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_focus_sessions_team_id 
  ON magictodo_focus_sessions(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- TAGS TABLE
-- ============================================================================

ALTER TABLE magictodo_tags 
  ADD CONSTRAINT fk_magictodo_tags_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magictodo_tags 
  ADD CONSTRAINT fk_magictodo_tags_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_tags_organization_id 
  ON magictodo_tags(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_tags_team_id 
  ON magictodo_tags(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- TEMPLATES TABLE
-- ============================================================================

ALTER TABLE magictodo_templates 
  ADD CONSTRAINT fk_magictodo_templates_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magictodo_templates 
  ADD CONSTRAINT fk_magictodo_templates_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_templates_organization_id 
  ON magictodo_templates(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_templates_team_id 
  ON magictodo_templates(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- DAILY LOGS TABLE
-- ============================================================================

ALTER TABLE magictodo_daily_logs 
  ADD CONSTRAINT fk_magictodo_daily_logs_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES tenancy_organizations(id) 
  ON DELETE SET NULL;

ALTER TABLE magictodo_daily_logs 
  ADD CONSTRAINT fk_magictodo_daily_logs_team 
  FOREIGN KEY (team_id) 
  REFERENCES tenancy_teams(id) 
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_daily_logs_organization_id 
  ON magictodo_daily_logs(organization_id) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_magictodo_daily_logs_team_id 
  ON magictodo_daily_logs(team_id) 
  WHERE team_id IS NOT NULL;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these after migration to verify foreign keys are in place:

-- Check all FK constraints were created
-- SELECT 
--   conname AS constraint_name,
--   conrelid::regclass AS table_name,
--   confrelid::regclass AS referenced_table
-- FROM pg_constraint
-- WHERE contype = 'f' 
--   AND conname LIKE 'fk_magictodo_%'
-- ORDER BY conname;

-- Check that no orphan records remain
-- SELECT 'tasks' AS table_name, COUNT(*) AS orphan_count 
-- FROM magictodo_tasks 
-- WHERE organization_id IS NOT NULL 
--   AND organization_id NOT IN (SELECT id FROM tenancy_organizations)
-- UNION ALL
-- SELECT 'projects', COUNT(*) 
-- FROM magictodo_projects 
-- WHERE organization_id IS NOT NULL 
--   AND organization_id NOT IN (SELECT id FROM tenancy_organizations);

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration (remove foreign keys):
-- ALTER TABLE magictodo_tasks DROP CONSTRAINT IF EXISTS fk_magictodo_tasks_organization;
-- ALTER TABLE magictodo_tasks DROP CONSTRAINT IF EXISTS fk_magictodo_tasks_team;
-- ALTER TABLE magictodo_projects DROP CONSTRAINT IF EXISTS fk_magictodo_projects_organization;
-- ALTER TABLE magictodo_projects DROP CONSTRAINT IF EXISTS fk_magictodo_projects_team;
-- (repeat for all tables)
