# Tenancy Domain Status - Quick Reference

**Last Updated:** February 8, 2026 (Session 3)  
**Overall Status:** 92% Complete (Code), ~55% Complete (Database)

---

## 🚨 CRITICAL ISSUES (2)

### 1. Migrations 0009-0015 NOT in Drizzle Journal

The `drizzle/meta/_journal.json` only lists migrations 0-8. While `pnpm db:migrate` ran successfully, **it only applied migrations already in the journal (0-8)**. Migrations 0009-0015 are NOT tracked — drizzle-kit can't see or run them.

**Fix Required:** Either:
- **Option A (recommended):** Add entries to `_journal.json` for 0009-0015, then run `pnpm db:migrate`
- **Option B:** Apply manually with `psql`:
```bash
psql $DATABASE_URL < drizzle/0009_tenancy_standalone_teams.sql
psql $DATABASE_URL < drizzle/0010_tenancy_unique_membership.sql
psql $DATABASE_URL < drizzle/0011_tenancy_rls_policies.sql
psql $DATABASE_URL < drizzle/0012_tenancy_audit_logs.sql
psql $DATABASE_URL < drizzle/0013_tenancy_invitations.sql
psql $DATABASE_URL < drizzle/0014_magictodo_tenancy_fk.sql
psql $DATABASE_URL < drizzle/0015_magicdrive_tenancy_integration.sql
```

### 2. MagicDrive TS Schema Out of Sync with Migration 0015

`packages/magicdrive/src/drizzle/magicdrive.schema.ts` still references `tenant_id` columns. Migration 0015 renames `tenant_id` → `legacy_tenant_id` and adds `organization_id` + `team_id`. Once applied, all Drizzle queries using `tenantId` will break at runtime.

**Fix Required:** Update the TS schema to match:
- Rename `tenantId: text("tenant_id")` → `legacyTenantId: text("legacy_tenant_id")`
- Add `organizationId: text("organization_id")` + `teamId: text("team_id")` on all tables

---

## Phase Status Summary

| Phase | Code | Database | Status |
|-------|------|----------|--------|
| **Phase 1: CRUD** | ✅ 100% | ⚠️ 75% | Journal gap blocks 0009-0010 |
| **Phase 2: Security** | ✅ 100% | ❌ 0% | 0011-0012 not applied |
| **Phase 3: Invitations** | ✅ 100% | ❌ 0% | 0013 not applied |
| **Phase 4: Integration** | ✅ 95% | ❌ 0% | TS schema gap remains |
| **Phase 5: Enterprise** | ⏳ 0% | ⏳ N/A | Deferred |

---

## What's Done (Session 2-3)

✅ **MagicDrive API Routes** — All 8 routes now extract `TENANT_HEADERS`:
- `drive/bff/route.ts`, `drive/v1/route.ts`
- `v1/route.ts`, `v1/objects/[id]/route.ts`
- `v1/duplicate-groups/route.ts`, `v1/tags/route.ts`
- `v1/saved-views/route.ts`, `v1/preferences/route.ts`

✅ **MagicDrive Server Actions** — All 8 modules have `TenantContext` params:
- documents, folders, tags, saved-views
- duplicates, collections, bulk, upload

✅ **UI** — `TenantScopeBadge` created and integrated into MagicDrive layout

✅ **MagicTodo** — Fully integrated (API routes + TS schema aligned)

✅ **Typecheck** — `pnpm typecheck` passes clean

---

## Remaining Work (Priority Order)

### P0 — Database (blocks production)
1. [ ] Register migrations 0009-0015 in `drizzle/meta/_journal.json`
2. [ ] Run `pnpm db:migrate` to actually apply them
3. [ ] Verify tables/columns exist with SQL queries

### P1 — TS Schema Alignment (blocks runtime)
4. [ ] Update `magicdrive.schema.ts`: rename `tenantId` → `legacyTenantId`, add `organizationId` + `teamId`
5. [ ] Update server actions that query by `tenantId` to use new columns
6. [ ] Update index definitions to match new column names

### P2 — Data Migration
7. [ ] Extend `migrate-magicdrive-data.mjs` to cover all 8 tables (currently only 3)
8. [ ] Run data migration to populate `organization_id` from `legacy_tenant_id`

### P3 — Testing & Verification
9. [ ] RLS verification scripts for tenancy/magicdrive tables
10. [ ] Phase 4 smoke test (MagicDrive + MagicTodo tenant isolation)
11. [ ] End-to-end multi-tenant user flow testing

### P4 — Cleanup
12. [ ] Resolve orphan `0008_magicdrive_schema_align.sql` (not in journal)
13. [ ] Remove `_` prefix from unused tenant vars in tags/saved-views routes

---

## Estimated Time to Complete

| Task Group | Estimate |
|---|---|
| P0: DB migrations | 1-2 hours |
| P1: TS schema alignment | 2-4 hours |
| P2: Data migration | 1-2 hours |
| P3: Testing | 1 day |
| **TOTAL to production** | **1-2 days** |
