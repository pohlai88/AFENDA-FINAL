/**
 * @afenda/tenancy — Server-side tenant context and services
 *
 * Provides tenant resolution and CRUD for organizations, teams, design system.
 */

import "server-only";

import type { TenantContext } from "../types";

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
export { tenancyAuditService } from "./audit.service";
export { tenancyInvitationService } from "./invitations/service";
export type { AuditAction, AuditLogParams, AuditLogFilters } from "./audit.service";
export { assertUserHasOrgRole, assertUserHasTeamRole } from "./guard";
export { withOrgAccess, withTeamAccess, withAuth } from "./middleware";
export type { RouteHandler, AuthorizedContext } from "./middleware";
export {
  orgCreationLimiter,
  memberInviteLimiter,
  teamCreationLimiter,
  mutationLimiter,
  checkRateLimit,
  withRateLimit,
  withRateLimitAuth,
  withRateLimitRoute,
} from "./rate-limit";

// Export tenant context utilities (Phase 4)
export {
  getTenantOrgContext,
  getTenantTeamContext,
  assertTenantOrgAccess,
  withTenantOrgScope,
  withTenantTeamScope,
  getActiveOrgForUser,
  getActiveTeamForUser,
  TENANT_HEADERS,
} from "./context";
export type { TenantContext } from "./context";

// Export email functionality for server-side use
export { sendInvitationEmail } from "../email/send-invitation-email";
export type { SendInvitationEmailParams } from "../email/send-invitation-email";
export { sendEmail, getResendClient, DEFAULT_FROM_EMAIL } from "../email/resend-client";
export type { SendEmailOptions } from "../email/resend-client";
