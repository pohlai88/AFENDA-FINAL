-- Migration: Tenancy FK Constraints + Indexes
-- Applied: Feb 9, 2026 (Priority 2)
-- Method: Zero-downtime two-phase FK creation (NOT VALID → VALIDATE)
--
-- Scope:
--   - 28 FK constraints (14 tables × 2 FKs each → tenancy_organizations + tenancy_teams)
--   - 19 indexes (12 MagicTodo org/team + 7 MagicDrive legacy_tenant_id)
--
-- Prerequisites verified:
--   - 0 orphan organization_id records across all 14 tables
--   - 0 orphan team_id records across all 14 tables
--   - Tested on Neon temp branch br-round-dream-a1qv5hrt before production apply

-- ============================================================================
-- PHASE 1: Add FK constraints NOT VALID (instant catalog-only operations)
-- from schema diff @@ +2870,230 @@
-- ============================================================================

-- MagicTodo FKs (12) — ON DELETE SET NULL
ALTER TABLE magictodo_tasks ADD CONSTRAINT fk_magictodo_tasks_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_tasks ADD CONSTRAINT fk_magictodo_tasks_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_projects ADD CONSTRAINT fk_magictodo_projects_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_projects ADD CONSTRAINT fk_magictodo_projects_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_focus_sessions ADD CONSTRAINT fk_magictodo_focus_sessions_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_focus_sessions ADD CONSTRAINT fk_magictodo_focus_sessions_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_snoozed_tasks ADD CONSTRAINT fk_magictodo_snoozed_tasks_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_snoozed_tasks ADD CONSTRAINT fk_magictodo_snoozed_tasks_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_time_entries ADD CONSTRAINT fk_magictodo_time_entries_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_time_entries ADD CONSTRAINT fk_magictodo_time_entries_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_task_comments ADD CONSTRAINT fk_magictodo_task_comments_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magictodo_task_comments ADD CONSTRAINT fk_magictodo_task_comments_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;

-- MagicDrive FKs (16) — ON DELETE SET NULL except tenant_settings (CASCADE)
ALTER TABLE magicdrive_objects ADD CONSTRAINT fk_magicdrive_objects_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_objects ADD CONSTRAINT fk_magicdrive_objects_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_uploads ADD CONSTRAINT fk_magicdrive_uploads_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_uploads ADD CONSTRAINT fk_magicdrive_uploads_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_duplicate_groups ADD CONSTRAINT fk_magicdrive_duplicate_groups_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_duplicate_groups ADD CONSTRAINT fk_magicdrive_duplicate_groups_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_tags ADD CONSTRAINT fk_magicdrive_tags_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_tags ADD CONSTRAINT fk_magicdrive_tags_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_saved_views ADD CONSTRAINT fk_magicdrive_saved_views_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_saved_views ADD CONSTRAINT fk_magicdrive_saved_views_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_user_preferences ADD CONSTRAINT fk_magicdrive_user_preferences_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_user_preferences ADD CONSTRAINT fk_magicdrive_user_preferences_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_tenant_settings ADD CONSTRAINT fk_magicdrive_tenant_settings_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE magicdrive_tenant_settings ADD CONSTRAINT fk_magicdrive_tenant_settings_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE magicdrive_collections ADD CONSTRAINT fk_magicdrive_collections_organization FOREIGN KEY (organization_id) REFERENCES tenancy_organizations(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE magicdrive_collections ADD CONSTRAINT fk_magicdrive_collections_team FOREIGN KEY (team_id) REFERENCES tenancy_teams(id) ON DELETE SET NULL NOT VALID;

-- ============================================================================
-- PHASE 2: Validate all FK constraints (SHARE UPDATE EXCLUSIVE lock, allows concurrent ops)
-- ============================================================================

ALTER TABLE magictodo_tasks VALIDATE CONSTRAINT fk_magictodo_tasks_organization;
ALTER TABLE magictodo_tasks VALIDATE CONSTRAINT fk_magictodo_tasks_team;
ALTER TABLE magictodo_projects VALIDATE CONSTRAINT fk_magictodo_projects_organization;
ALTER TABLE magictodo_projects VALIDATE CONSTRAINT fk_magictodo_projects_team;
ALTER TABLE magictodo_focus_sessions VALIDATE CONSTRAINT fk_magictodo_focus_sessions_organization;
ALTER TABLE magictodo_focus_sessions VALIDATE CONSTRAINT fk_magictodo_focus_sessions_team;
ALTER TABLE magictodo_snoozed_tasks VALIDATE CONSTRAINT fk_magictodo_snoozed_tasks_organization;
ALTER TABLE magictodo_snoozed_tasks VALIDATE CONSTRAINT fk_magictodo_snoozed_tasks_team;
ALTER TABLE magictodo_time_entries VALIDATE CONSTRAINT fk_magictodo_time_entries_organization;
ALTER TABLE magictodo_time_entries VALIDATE CONSTRAINT fk_magictodo_time_entries_team;
ALTER TABLE magictodo_task_comments VALIDATE CONSTRAINT fk_magictodo_task_comments_organization;
ALTER TABLE magictodo_task_comments VALIDATE CONSTRAINT fk_magictodo_task_comments_team;
ALTER TABLE magicdrive_objects VALIDATE CONSTRAINT fk_magicdrive_objects_organization;
ALTER TABLE magicdrive_objects VALIDATE CONSTRAINT fk_magicdrive_objects_team;
ALTER TABLE magicdrive_uploads VALIDATE CONSTRAINT fk_magicdrive_uploads_organization;
ALTER TABLE magicdrive_uploads VALIDATE CONSTRAINT fk_magicdrive_uploads_team;
ALTER TABLE magicdrive_duplicate_groups VALIDATE CONSTRAINT fk_magicdrive_duplicate_groups_organization;
ALTER TABLE magicdrive_duplicate_groups VALIDATE CONSTRAINT fk_magicdrive_duplicate_groups_team;
ALTER TABLE magicdrive_tags VALIDATE CONSTRAINT fk_magicdrive_tags_organization;
ALTER TABLE magicdrive_tags VALIDATE CONSTRAINT fk_magicdrive_tags_team;
ALTER TABLE magicdrive_saved_views VALIDATE CONSTRAINT fk_magicdrive_saved_views_organization;
ALTER TABLE magicdrive_saved_views VALIDATE CONSTRAINT fk_magicdrive_saved_views_team;
ALTER TABLE magicdrive_user_preferences VALIDATE CONSTRAINT fk_magicdrive_user_preferences_organization;
ALTER TABLE magicdrive_user_preferences VALIDATE CONSTRAINT fk_magicdrive_user_preferences_team;
ALTER TABLE magicdrive_tenant_settings VALIDATE CONSTRAINT fk_magicdrive_tenant_settings_organization;
ALTER TABLE magicdrive_tenant_settings VALIDATE CONSTRAINT fk_magicdrive_tenant_settings_team;
ALTER TABLE magicdrive_collections VALIDATE CONSTRAINT fk_magicdrive_collections_organization;
ALTER TABLE magicdrive_collections VALIDATE CONSTRAINT fk_magicdrive_collections_team;

-- ============================================================================
-- PHASE 3: Create indexes (IF NOT EXISTS for idempotency)
-- ============================================================================

-- MagicTodo tenancy indexes (12 — org + team for 6 tables)
CREATE INDEX IF NOT EXISTS idx_magictodo_tasks_organization_id ON magictodo_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_tasks_team_id ON magictodo_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_projects_organization_id ON magictodo_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_projects_team_id ON magictodo_projects(team_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_focus_sessions_organization_id ON magictodo_focus_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_focus_sessions_team_id ON magictodo_focus_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_snoozed_tasks_organization_id ON magictodo_snoozed_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_snoozed_tasks_team_id ON magictodo_snoozed_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_time_entries_organization_id ON magictodo_time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_time_entries_team_id ON magictodo_time_entries(team_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_task_comments_organization_id ON magictodo_task_comments(organization_id);
CREATE INDEX IF NOT EXISTS idx_magictodo_task_comments_team_id ON magictodo_task_comments(team_id);

-- MagicDrive legacy_tenant_id indexes (7 — matching tenancyIndexes() convention)
CREATE INDEX IF NOT EXISTS idx_magicdrive_objects_legacy_tenant_id ON magicdrive_objects(legacy_tenant_id);
CREATE INDEX IF NOT EXISTS idx_magicdrive_uploads_legacy_tenant_id ON magicdrive_uploads(legacy_tenant_id);
CREATE INDEX IF NOT EXISTS idx_magicdrive_duplicate_groups_legacy_tenant_id ON magicdrive_duplicate_groups(legacy_tenant_id);
CREATE INDEX IF NOT EXISTS idx_magicdrive_tags_legacy_tenant_id ON magicdrive_tags(legacy_tenant_id);
CREATE INDEX IF NOT EXISTS idx_magicdrive_saved_views_legacy_tenant_id ON magicdrive_saved_views(legacy_tenant_id);
CREATE INDEX IF NOT EXISTS idx_magicdrive_user_preferences_legacy_tenant_id ON magicdrive_user_preferences(legacy_tenant_id);
CREATE INDEX IF NOT EXISTS idx_magicdrive_collections_legacy_tenant_id ON magicdrive_collections(legacy_tenant_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all FK constraints exist:
-- SELECT conname, conrelid::regclass, confrelid::regclass
-- FROM pg_constraint WHERE contype = 'f'
--   AND (conname LIKE 'fk_magictodo_%' OR conname LIKE 'fk_magicdrive_%')
-- ORDER BY conname;
--
-- Expected: 28 rows
--
-- Confirm diff is empty:
-- Run compare_database_schema on temp branch br-round-dream-a1qv5hrt → should return ""
