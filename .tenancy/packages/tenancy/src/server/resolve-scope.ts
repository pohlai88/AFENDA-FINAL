import "@afenda/shared/server/only"

import { and, eq } from "drizzle-orm"

import { subdomainConfig, type Db, withRlsDb } from "@afenda/shared/db"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type ResolvedTenantScope = {
  organizationId: string | null
  teamId: string | null
}

export async function resolveTenantScopeInDb(tenantId: string, db: Db): Promise<ResolvedTenantScope> {
  if (!tenantId) return { organizationId: null, teamId: null }

  if (UUID_RE.test(tenantId)) {
    return { organizationId: tenantId, teamId: null }
  }

  const subdomain = tenantId.toLowerCase()

  const rows = await db
    .select({
      organizationId: subdomainConfig.organizationId,
      teamId: subdomainConfig.teamId,
    })
    .from(subdomainConfig)
    .where(and(eq(subdomainConfig.subdomain, subdomain), eq(subdomainConfig.isActive, true)))
    .limit(1)

  return {
    organizationId: rows[0]?.organizationId ?? null,
    teamId: rows[0]?.teamId ?? null,
  }
}

/**
 * Resolve an incoming tenant identifier to concrete org/team UUIDs.
 *
 * Rules:
 * - If `tenantId` is already a UUID, treat it as `organizationId`.
 * - Otherwise treat it as a subdomain and resolve via `neon_subdomain_config`.
 *
 * Security:
 * - Resolution is performed under RLS using `withRlsDb(userId, ...)` so only
 *   members of the organization can resolve it.
 */
export async function resolveTenantScopeForUser(
  userId: string,
  tenantId: string
): Promise<ResolvedTenantScope> {
  return await withRlsDb(userId, async (db) => await resolveTenantScopeInDb(tenantId, db))
}

