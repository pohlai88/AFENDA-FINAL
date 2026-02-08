-- Pre-migration diagnostic: Check for orphan records
-- Run this BEFORE executing migration 0014

-- ============================================================================
-- Check MagicTodo orphan records
-- ============================================================================

-- Check orphan organizationId in tasks
SELECT 
  'magictodo_tasks' as table_name,
  'organization_id' as column_name,
  COUNT(*) as orphan_count
FROM magictodo_tasks 
WHERE organization_id IS NOT NULL 
  AND organization_id NOT IN (SELECT id FROM tenancy_organizations);

-- Check orphan teamId in tasks
SELECT 
  'magictodo_tasks' as table_name,
  'team_id' as column_name,
  COUNT(*) as orphan_count
FROM magictodo_tasks 
WHERE team_id IS NOT NULL 
  AND team_id NOT IN (SELECT id FROM tenancy_teams);

-- Check orphan organizationId in projects
SELECT 
  'magictodo_projects' as table_name,
  'organization_id' as column_name,
  COUNT(*) as orphan_count
FROM magictodo_projects 
WHERE organization_id IS NOT NULL 
  AND organization_id NOT IN (SELECT id FROM tenancy_organizations);

-- Check orphan teamId in projects
SELECT 
  'magictodo_projects' as table_name,
  'team_id' as column_name,
  COUNT(*) as orphan_count
FROM magictodo_projects 
WHERE team_id IS NOT NULL 
  AND team_id NOT IN (SELECT id FROM tenancy_teams);

-- Check orphan organizationId in focus_sessions
SELECT 
  'magictodo_focus_sessions' as table_name,
  'organization_id' as column_name,
  COUNT(*) as orphan_count
FROM magictodo_focus_sessions 
WHERE organization_id IS NOT NULL 
  AND organization_id NOT IN (SELECT id FROM tenancy_organizations);

-- Check orphan teamId in focus_sessions
SELECT 
  'magictodo_focus_sessions' as table_name,
  'team_id' as column_name,
  COUNT(*) as orphan_count
FROM magictodo_focus_sessions 
WHERE team_id IS NOT NULL 
  AND team_id NOT IN (SELECT id FROM tenancy_teams);

-- Summary
SELECT 'SUMMARY' as check_type, 
  (
    COALESCE((SELECT COUNT(*) FROM magictodo_tasks WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM tenancy_organizations)), 0) +
    COALESCE((SELECT COUNT(*) FROM magictodo_tasks WHERE team_id IS NOT NULL AND team_id NOT IN (SELECT id FROM tenancy_teams)), 0) +
    COALESCE((SELECT COUNT(*) FROM magictodo_projects WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM tenancy_organizations)), 0) +
    COALESCE((SELECT COUNT(*) FROM magictodo_projects WHERE team_id IS NOT NULL AND team_id NOT IN (SELECT id FROM tenancy_teams)), 0) +
    COALESCE((SELECT COUNT(*) FROM magictodo_focus_sessions WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM tenancy_organizations)), 0) +
    COALESCE((SELECT COUNT(*) FROM magictodo_focus_sessions WHERE team_id IS NOT NULL AND team_id NOT IN (SELECT id FROM tenancy_teams)), 0)
  ) as total_orphan_records;

-- If total_orphan_records > 0, migration will FAIL
-- Fix orphan records before proceeding
