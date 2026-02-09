-- Migration 0018: Auto-maintain updated_at via trigger
-- Creates a reusable trigger function and attaches it to all tables with updated_at.
--
-- This ensures updated_at is always maintained at the DB level, regardless of
-- whether the application code sets it. Neon PG 17 compatible.
--
-- The trigger fires BEFORE UPDATE, is cheap (single column SET), and is
-- idempotent — safe to re-run.

-- ─── Create the trigger function ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Attach to Orchestra tables ──────────────────────────────────────
DROP TRIGGER IF EXISTS trg_set_updated_at ON "orchestra_service_registry";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "orchestra_service_registry"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "orchestra_admin_config";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "orchestra_admin_config"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "orchestra_backup_schedule";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "orchestra_backup_schedule"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "orchestra_custom_templates";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "orchestra_custom_templates"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "orchestra_app_domains";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "orchestra_app_domains"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Attach to Tenancy tables ────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_set_updated_at ON "tenancy_organizations";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "tenancy_organizations"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "tenancy_teams";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "tenancy_teams"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "tenancy_memberships";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "tenancy_memberships"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "tenancy_tenant_design_system";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "tenancy_tenant_design_system"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "tenancy_invitations";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "tenancy_invitations"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Attach to MagicTodo tables ──────────────────────────────────────
DROP TRIGGER IF EXISTS trg_set_updated_at ON "magictodo_tasks";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magictodo_tasks"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magictodo_projects";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magictodo_projects"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magictodo_focus_sessions";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magictodo_focus_sessions"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magictodo_snoozed_tasks";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magictodo_snoozed_tasks"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magictodo_time_entries";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magictodo_time_entries"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magictodo_task_comments";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magictodo_task_comments"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Attach to MagicDrive tables ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_set_updated_at ON "magicdrive_objects";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magicdrive_objects"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magicdrive_object_index";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magicdrive_object_index"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magicdrive_saved_views";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magicdrive_saved_views"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magicdrive_user_preferences";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magicdrive_user_preferences"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magicdrive_tenant_settings";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magicdrive_tenant_settings"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON "magicdrive_collections";
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON "magicdrive_collections"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- NOTE: audit_log_comments trigger will be added when that table is created.
-- The table exists in Drizzle schema but has not been migrated to DB yet.
