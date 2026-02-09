-- Verify Postgres RLS for AFENDA (Neon + Drizzle)
--
-- Run this in Neon SQL Editor (or via neonctl sql) using an OWNER/admin connection.
--
-- What this does:
-- 1) Temporarily grants `app_user` to the owner so we can `SET ROLE app_user` for testing.
-- 2) Inserts rows for two different users into tenancy tables.
-- 3) Verifies each user can only see their own rows (RLS isolation).
-- 4) Rolls back (no data is persisted).
-- 5) Revokes `app_user` from the owner (cleanup).
--
-- NOTE:
-- - Replace <USER_ID_1> and <USER_ID_2> with real Neon Auth user UUIDs from `neon_auth.users`.
-- - Replace <ORG_ID> with an existing tenancy_organizations.id.
-- - Runtime RLS enforcement should be done by connecting as `app_user` (non-owner).

-- 0) Ensure app_user exists (migration creates it, but safe to keep here too)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOINHERIT;
  END IF;
END $$;

-- 1) Allow owner to SET ROLE app_user for the test
GRANT app_user TO CURRENT_USER;

BEGIN;

-- 2) Act as app_user (RLS enforced) and set per-request context
SET LOCAL ROLE app_user;

-- Test with tenancy_memberships (has RLS policies from migration 0011)
SELECT set_config('app.user_id', '<USER_ID_1>', true);
INSERT INTO public.tenancy_memberships (id, user_id, organization_id, role)
VALUES ('rls-test-m1', '<USER_ID_1>', '<ORG_ID>', 'member');

SELECT set_config('app.user_id', '<USER_ID_2>', true);
INSERT INTO public.tenancy_memberships (id, user_id, organization_id, role)
VALUES ('rls-test-m2', '<USER_ID_2>', '<ORG_ID>', 'member');

-- 3) Verify isolation: each user should only see their own membership
SELECT set_config('app.user_id', '<USER_ID_1>', true);
SELECT count(*)::int AS visible_memberships_for_u1
  FROM public.tenancy_memberships
  WHERE id LIKE 'rls-test-%';

SELECT set_config('app.user_id', '<USER_ID_2>', true);
SELECT count(*)::int AS visible_memberships_for_u2
  FROM public.tenancy_memberships
  WHERE id LIKE 'rls-test-%';

-- 4) Verify RLS on tenancy_organizations
SELECT set_config('app.user_id', '<USER_ID_1>', true);
SELECT count(*)::int AS visible_orgs_for_u1 FROM public.tenancy_organizations;

ROLLBACK;

-- 5) Cleanup (optional, but recommended)
REVOKE app_user FROM CURRENT_USER;

