-- Migration 0017: Cleanup redundant MagicDrive indexes
-- from diff: Removes 6 duplicate legacy_tenant_id indexes (old naming convention)
-- and migrates magicdrive_tenant_settings unique constraint from column-level to explicit unique index.
--
-- Safe: DROP INDEX CONCURRENTLY for zero-downtime. IF EXISTS guards.
-- Neon PG 17 compatible.

-- ─── Drop duplicate legacy_tenant_id indexes ────────────────────────
-- Each of these tables had TWO indexes on legacy_tenant_id:
--   - magicdrive_*_tenant_id_idx        (old naming, being dropped)
--   - idx_magicdrive_*_legacy_tenant_id  (standard naming, kept)

DROP INDEX CONCURRENTLY IF EXISTS "magicdrive_objects_tenant_id_idx";
DROP INDEX CONCURRENTLY IF EXISTS "magicdrive_uploads_tenant_id_idx";
DROP INDEX CONCURRENTLY IF EXISTS "magicdrive_duplicate_groups_tenant_id_idx";
DROP INDEX CONCURRENTLY IF EXISTS "magicdrive_tags_tenant_id_idx";
DROP INDEX CONCURRENTLY IF EXISTS "magicdrive_saved_views_tenant_id_idx";
DROP INDEX CONCURRENTLY IF EXISTS "magicdrive_collections_tenant_id_idx";

-- ─── Migrate tenant_settings unique constraint ──────────────────────
-- Previously: column-level .unique() + regular index magicdrive_tenant_settings_tenant_id_idx
-- Now: explicit uniqueIndex in schema third-arg

-- Drop the old regular index
DROP INDEX CONCURRENTLY IF EXISTS "magicdrive_tenant_settings_tenant_id_idx";

-- Drop the old column-level unique constraint (Drizzle names it {table}_{column}_unique)
ALTER TABLE "magicdrive_tenant_settings"
  DROP CONSTRAINT IF EXISTS "magicdrive_tenant_settings_legacy_tenant_id_unique";

-- Create the new explicit unique index
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "magicdrive_tenant_settings_legacy_tenant_unique"
  ON "magicdrive_tenant_settings" ("legacy_tenant_id");
