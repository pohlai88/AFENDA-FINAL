/**
 * @afenda/tenancy — Server-side tenant context
 *
 * Provides tenant resolution for multi-tenant operations.
 * In development, uses default tenant; in production, resolves from headers/session.
 */

import "server-only";

export interface TenantContext {
  tenantId: string;
  organizationId?: string | null;
  teamId?: string | null;
}

/**
 * Get the current tenant context.
 * Resolves from x-tenant-id header or falls back to default for development.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const tenantId =
    h.get("x-tenant-id") ??
    process.env.DEFAULT_TENANT_ID ??
    (process.env.NODE_ENV === "production" ? "" : "default-tenant");
  return {
    tenantId: tenantId || "default-tenant",
    organizationId: tenantId || null,
    teamId: null,
  };
}
