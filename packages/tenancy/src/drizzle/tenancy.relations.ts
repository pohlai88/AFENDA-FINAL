/**
 * @layer domain (tenancy)
 * @responsibility Drizzle ORM relation definitions for Tenancy domain tables.
 *
 * Enables the relational query API:
 * ```ts
 * db.query.tenancyOrganizations.findMany({ with: { teams: true, memberships: true } })
 * ```
 */

import { relations } from "drizzle-orm";
import {
  tenancyOrganizations,
  tenancyTeams,
  tenancyMemberships,
  tenancyTenantDesignSystem,
  tenancyAuditLogs,
  tenancyInvitations,
} from "./tenancy.schema";

// ─── Organizations ───────────────────────────────────────────────────
export const tenancyOrganizationsRelations = relations(
  tenancyOrganizations,
  ({ many }) => ({
    teams: many(tenancyTeams),
    memberships: many(tenancyMemberships),
    auditLogs: many(tenancyAuditLogs),
    invitations: many(tenancyInvitations),
  })
);

// ─── Teams ───────────────────────────────────────────────────────────
export const tenancyTeamsRelations = relations(
  tenancyTeams,
  ({ one, many }) => ({
    organization: one(tenancyOrganizations, {
      fields: [tenancyTeams.organizationId],
      references: [tenancyOrganizations.id],
    }),
    parent: one(tenancyTeams, {
      fields: [tenancyTeams.parentId],
      references: [tenancyTeams.id],
      relationName: "teamHierarchy",
    }),
    children: many(tenancyTeams, { relationName: "teamHierarchy" }),
    memberships: many(tenancyMemberships),
    auditLogs: many(tenancyAuditLogs),
    invitations: many(tenancyInvitations),
  })
);

// ─── Memberships ─────────────────────────────────────────────────────
export const tenancyMembershipsRelations = relations(
  tenancyMemberships,
  ({ one }) => ({
    organization: one(tenancyOrganizations, {
      fields: [tenancyMemberships.organizationId],
      references: [tenancyOrganizations.id],
    }),
    team: one(tenancyTeams, {
      fields: [tenancyMemberships.teamId],
      references: [tenancyTeams.id],
    }),
  })
);

// ─── Audit Logs ──────────────────────────────────────────────────────
export const tenancyAuditLogsRelations = relations(
  tenancyAuditLogs,
  ({ one }) => ({
    organization: one(tenancyOrganizations, {
      fields: [tenancyAuditLogs.organizationId],
      references: [tenancyOrganizations.id],
    }),
    team: one(tenancyTeams, {
      fields: [tenancyAuditLogs.teamId],
      references: [tenancyTeams.id],
    }),
  })
);

// ─── Invitations ─────────────────────────────────────────────────────
export const tenancyInvitationsRelations = relations(
  tenancyInvitations,
  ({ one }) => ({
    organization: one(tenancyOrganizations, {
      fields: [tenancyInvitations.organizationId],
      references: [tenancyOrganizations.id],
    }),
    team: one(tenancyTeams, {
      fields: [tenancyInvitations.teamId],
      references: [tenancyTeams.id],
    }),
  })
);

// ─── Tenant Design System (standalone, no FK relations) ──────────────
// tenancyTenantDesignSystem has tenantId PK but no FK to organizations.
// No Drizzle relation needed.
