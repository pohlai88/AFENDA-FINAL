-- ============================================================
-- Migration 0011: Optimized Row-Level Security for Tenancy Domain
-- Applied: 2025-02-08
-- Covers: 6 tables, 20 policies, auth bridge, performance indexes
--
-- Fixes from original version:
--   1. Created auth.user_id() bridge (was referencing non-existent function)
--   2. Uses EXISTS instead of IN for correlated subqueries (planner-friendly)
--   3. Filters on is_active = true in all membership checks
--   4. Covers all 6 tenancy tables (was only 3)
--   5. Targets TO authenticated role explicitly
--   6. Includes GRANTs (authenticated had zero table permissions)
--   7. Fixed uuid::text cast for neon_auth.user.id lookups
--   8. Correct tenant_id (not organization_id) for design_system
-- ============================================================

-- 1. Create auth schema with bridge function
-- from diff @@ schema creation @@
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO authenticated;

CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text
  LANGUAGE sql STABLE
  SET search_path = ''
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    nullif(current_setting('app.user_id', true), '')
  )
$$;

COMMENT ON FUNCTION auth.user_id() IS 'Returns authenticated user ID from JWT (Data API) or GUC (Drizzle). Returns NULL if unauthenticated.';

GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated;

-- 2. Grant neon_auth.user read access for invitation email lookups
-- from diff @@ ACL grants @@
GRANT USAGE ON SCHEMA neon_auth TO authenticated;
GRANT SELECT (id, email) ON TABLE neon_auth."user" TO authenticated;

-- 3. Grant table permissions to authenticated role
-- from diff @@ table ACLs @@
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenancy_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenancy_teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenancy_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE tenancy_invitations TO authenticated;
GRANT SELECT, INSERT ON TABLE tenancy_audit_logs TO authenticated;  -- append-only
GRANT SELECT, INSERT, UPDATE ON TABLE tenancy_tenant_design_system TO authenticated;

-- 4. Enable RLS on all 6 tenancy tables
ALTER TABLE tenancy_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancy_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancy_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancy_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancy_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancy_tenant_design_system ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. ORGANIZATIONS policies (4)
-- ============================================================

CREATE POLICY org_select_member ON tenancy_organizations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.organization_id = tenancy_organizations.id
      AND m.user_id = auth.user_id()
      AND m.is_active = true
  ));

CREATE POLICY org_insert_authenticated ON tenancy_organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.user_id() IS NOT NULL);

CREATE POLICY org_update_owner ON tenancy_organizations
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.organization_id = tenancy_organizations.id
      AND m.user_id = auth.user_id()
      AND m.role = 'owner'
      AND m.is_active = true
  ));

CREATE POLICY org_delete_owner ON tenancy_organizations
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.organization_id = tenancy_organizations.id
      AND m.user_id = auth.user_id()
      AND m.role = 'owner'
      AND m.is_active = true
  ));

-- ============================================================
-- 6. TEAMS policies (4)
-- ============================================================

CREATE POLICY team_select_member ON tenancy_teams
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.user_id = auth.user_id()
      AND m.is_active = true
      AND (m.team_id = tenancy_teams.id OR m.organization_id = tenancy_teams.organization_id)
  ));

CREATE POLICY team_insert_org_member ON tenancy_teams
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.organization_id = tenancy_teams.organization_id
      AND m.user_id = auth.user_id()
      AND m.is_active = true
  ));

CREATE POLICY team_update_admin ON tenancy_teams
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.user_id = auth.user_id()
      AND m.is_active = true
      AND (
        (m.team_id = tenancy_teams.id AND m.role IN ('owner', 'admin'))
        OR (m.organization_id = tenancy_teams.organization_id AND m.role = 'owner')
      )
  ));

CREATE POLICY team_delete_admin ON tenancy_teams
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.user_id = auth.user_id()
      AND m.is_active = true
      AND (
        (m.team_id = tenancy_teams.id AND m.role IN ('owner', 'admin'))
        OR (m.organization_id = tenancy_teams.organization_id AND m.role = 'owner')
      )
  ));

-- ============================================================
-- 7. MEMBERSHIPS policies (4)
-- ============================================================

CREATE POLICY membership_select_visible ON tenancy_memberships
  FOR SELECT TO authenticated
  USING (
    user_id = auth.user_id()
    OR EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.user_id = auth.user_id()
        AND m.is_active = true
        AND (
          (m.organization_id IS NOT NULL AND m.organization_id = tenancy_memberships.organization_id)
          OR (m.team_id IS NOT NULL AND m.team_id = tenancy_memberships.team_id)
        )
    )
  );

CREATE POLICY membership_insert_admin ON tenancy_memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.organization_id = tenancy_memberships.organization_id
        AND m.user_id = auth.user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    ))
    OR (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.user_id = auth.user_id()
        AND m.is_active = true
        AND (
          (m.team_id = tenancy_memberships.team_id AND m.role IN ('owner', 'admin'))
          OR (m.organization_id = (SELECT t.organization_id FROM tenancy_teams t WHERE t.id = tenancy_memberships.team_id) AND m.role = 'owner')
        )
    ))
  );

CREATE POLICY membership_update_admin ON tenancy_memberships
  FOR UPDATE TO authenticated
  USING (
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.organization_id = tenancy_memberships.organization_id
        AND m.user_id = auth.user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    ))
    OR (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.user_id = auth.user_id()
        AND m.is_active = true
        AND (
          (m.team_id = tenancy_memberships.team_id AND m.role IN ('owner', 'admin'))
          OR (m.organization_id = (SELECT t.organization_id FROM tenancy_teams t WHERE t.id = tenancy_memberships.team_id) AND m.role = 'owner')
        )
    ))
  );

CREATE POLICY membership_delete_self_or_admin ON tenancy_memberships
  FOR DELETE TO authenticated
  USING (
    user_id = auth.user_id()
    OR (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.organization_id = tenancy_memberships.organization_id
        AND m.user_id = auth.user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    ))
    OR (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.user_id = auth.user_id()
        AND m.is_active = true
        AND (
          (m.team_id = tenancy_memberships.team_id AND m.role IN ('owner', 'admin'))
          OR (m.organization_id = (SELECT t.organization_id FROM tenancy_teams t WHERE t.id = tenancy_memberships.team_id) AND m.role = 'owner')
        )
    ))
  );

-- ============================================================
-- 8. INVITATIONS policies (3)
-- ============================================================

CREATE POLICY invitation_select_participant ON tenancy_invitations
  FOR SELECT TO authenticated
  USING (
    invited_by = auth.user_id()
    OR email = (SELECT u.email FROM neon_auth."user" u WHERE u.id::text = auth.user_id())
    OR EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.user_id = auth.user_id()
        AND m.is_active = true
        AND (
          (m.organization_id = tenancy_invitations.organization_id AND m.role IN ('owner', 'admin'))
          OR (m.team_id = tenancy_invitations.team_id AND m.role IN ('owner', 'admin'))
        )
    )
  );

CREATE POLICY invitation_insert_admin ON tenancy_invitations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.user_id = auth.user_id()
      AND m.is_active = true
      AND (
        (m.organization_id = tenancy_invitations.organization_id AND m.role IN ('owner', 'admin'))
        OR (m.team_id = tenancy_invitations.team_id AND m.role IN ('owner', 'admin'))
      )
  ));

CREATE POLICY invitation_update_participant ON tenancy_invitations
  FOR UPDATE TO authenticated
  USING (
    invited_by = auth.user_id()
    OR email = (SELECT u.email FROM neon_auth."user" u WHERE u.id::text = auth.user_id())
    OR EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.user_id = auth.user_id()
        AND m.is_active = true
        AND (
          (m.organization_id = tenancy_invitations.organization_id AND m.role IN ('owner', 'admin'))
          OR (m.team_id = tenancy_invitations.team_id AND m.role IN ('owner', 'admin'))
        )
    )
  );

-- ============================================================
-- 9. AUDIT LOGS policies (2) — append-only for non-admins
-- ============================================================

CREATE POLICY audit_select_scoped ON tenancy_audit_logs
  FOR SELECT TO authenticated
  USING (
    actor_id = auth.user_id()
    OR EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.user_id = auth.user_id()
        AND m.is_active = true
        AND m.organization_id = tenancy_audit_logs.organization_id
        AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY audit_insert_authenticated ON tenancy_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.user_id() IS NOT NULL);

-- ============================================================
-- 10. TENANT DESIGN SYSTEM policies (3)
-- ============================================================

CREATE POLICY design_select_member ON tenancy_tenant_design_system
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.user_id = auth.user_id()
      AND m.is_active = true
      AND m.organization_id = tenancy_tenant_design_system.tenant_id
  ));

CREATE POLICY design_update_admin ON tenancy_tenant_design_system
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.user_id = auth.user_id()
      AND m.is_active = true
      AND m.organization_id = tenancy_tenant_design_system.tenant_id
      AND m.role IN ('owner', 'admin')
  ));

CREATE POLICY design_insert_admin ON tenancy_tenant_design_system
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tenancy_memberships m
    WHERE m.user_id = auth.user_id()
      AND m.is_active = true
      AND m.organization_id = tenancy_tenant_design_system.tenant_id
      AND m.role IN ('owner', 'admin')
  ));

-- ============================================================
-- 11. Performance indexes for RLS policy subqueries
-- Partial composite indexes — only index active memberships
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_memberships_user_org_active
  ON tenancy_memberships(user_id, organization_id)
  WHERE organization_id IS NOT NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_memberships_user_team_active
  ON tenancy_memberships(user_id, team_id)
  WHERE team_id IS NOT NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_memberships_org_role_active
  ON tenancy_memberships(organization_id, role)
  WHERE organization_id IS NOT NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_memberships_team_role_active
  ON tenancy_memberships(team_id, role)
  WHERE team_id IS NOT NULL AND is_active = true;
