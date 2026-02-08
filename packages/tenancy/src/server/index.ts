/**
 * @afenda/tenancy — Server-side tenant context and services
 *
 * Provides tenant resolution and CRUD for organizations, teams, design system.
 */

import "server-only";

import type { TenantContext } from "../types";

export type { TenantContext };

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

export { tenancyOrganizationService } from "./organizations/service";
export { tenancyTeamService } from "./teams/service";
export { tenancyMembershipService } from "./memberships/service";
export { tenancyDesignSystemService } from "./design-system.service";
export { assertUserHasOrgRole, assertUserHasTeamRole } from "./guard";
