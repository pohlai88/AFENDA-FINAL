import { defineConfig } from "drizzle-kit"
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

/**
 * Drizzle Kit configuration for Afenda multi-tenant monorepo.
 *
 * ## Schema Manifest System
 *
 * All domain schemas MUST use the unified factories from
 * `@afenda/shared/drizzle/manifest`:
 *
 *   - Column factories: pkText(), tenantId(), timestamps(), etc.
 *   - Index factories: idx(), uidx(), tenantIndexes()
 *   - FK factories: tenantFK(), teamFK(), tenantFKs()
 *   - RLS policy factories: domainPolicies(), policyTenantMemberRead(), etc.
 *
 * This ensures:
 *   1. Zero naming drift across 40+ tables.
 *   2. Every domain table has tenant_id + team_id (multi-tenancy contract).
 *   3. All domain tables have RLS policies (security contract).
 *   4. CI validates schema compliance via the table registry.
 *
 * @see packages/shared/src/drizzle/manifest/README.md
 * @see .dev-note/multi-tenancy-schema.md
 *
 * ## Migration Checklist
 *
 * Before generating migrations:
 *   1. `pnpm typecheck` — confirm no TS errors
 *   2. Verify all new tables use manifest factories
 *   3. Check `packages/shared/src/drizzle/manifest/registry.ts` compliance
 *
 * Generate migration:
 *   `pnpm drizzle-kit generate`
 *
 * Apply migration:
 *   `pnpm tsx scripts/run-migration.mjs <migration-name>`
 */

export default defineConfig({
  schema: [
    "./packages/shared/src/drizzle/index.ts",
    "./packages/orchestra/src/drizzle/orchestra.schema.ts",
    "./packages/orchestra/src/drizzle/orchestra.relations.ts",
    "./packages/magictodo/src/drizzle/magictodo.schema.ts",
    "./packages/magictodo/src/drizzle/magictodo.relations.ts",
    "./packages/magicdrive/src/drizzle/magicdrive.schema.ts",
    "./packages/magicdrive/src/drizzle/magicdrive.relations.ts",
    "./packages/tenancy/src/drizzle/tenancy.schema.ts",
    "./packages/tenancy/src/drizzle/tenancy.relations.ts"
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: (() => {
      // Use an admin/owner connection for migrations (DDL), while allowing runtime to use
      // a restricted role (e.g. `app_user`) for RLS enforcement.
      const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL
      if (!url) {
        throw new Error(
          "DATABASE_URL_MIGRATIONS (preferred) or DATABASE_URL is required for drizzle-kit. Set in .env."
        )
      }
      return url
    })(),
  },
  // Exclude extension-managed views that drizzle-kit cannot DROP.
  tablesFilter: ["!pg_stat_statements*"],
  // Keep `push` non-interactive by default.
  strict: false,
})

