/**
 * @domain tenancy
 * @layer types
 * @responsibility Shared types for multi-tenancy (safe for barrel export; no server-only)
 */

/**
 * Resolved tenant context for the current request.
 * Used by server-only code; type is exported from barrel for type-only imports.
 */
export interface TenantContext {
  tenantId: string;
  organizationId?: string | null;
  teamId?: string | null;
}
