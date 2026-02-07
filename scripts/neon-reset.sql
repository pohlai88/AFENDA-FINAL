-- DANGER: destructive reset helpers for a NEW database.
-- Use on a fresh Neon branch / dev DB only.
--
-- Recommended workflow:
-- 1) Create a new Neon branch for dev/preview
-- 2) Run this file in Neon SQL editor (or via neonctl sql)
-- 3) Run `pnpm db:migrate` to apply `drizzle/0000_init.sql`
--
-- This script resets ONLY the public schema (business tables).
-- It does NOT drop `neon_auth` because Neon Auth manages that schema.

BEGIN;

-- Drop and recreate public schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Restore default privileges for public schema
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT CREATE ON SCHEMA public TO PUBLIC;

COMMIT;

-- OPTIONAL (NOT RECOMMENDED): fully remove Neon Auth schema.
-- If you do this, you must re-enable Neon Auth in Neon Console to recreate it.
-- DROP SCHEMA IF EXISTS neon_auth CASCADE;

