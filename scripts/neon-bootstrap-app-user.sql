-- Creates a non-owner role for app runtime so Postgres RLS is enforced.
-- Run manually in Neon SQL editor. Then update DATABASE_URL to use this role.
--
-- IMPORTANT:
-- - Choose a strong password and store it in your secret manager.
-- - This script grants access to public schema tables.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN NOINHERIT;
  ELSE
    ALTER ROLE app_user LOGIN;
  END IF;
END $$;

-- Set password (replace placeholder)
-- ALTER ROLE app_user WITH PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- Sequences (needed for SERIAL/identity columns)
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;

