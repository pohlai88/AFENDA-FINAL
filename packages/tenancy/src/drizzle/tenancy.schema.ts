/**
 * @layer domain (tenancy)
 * @responsibility Tenancy domain tables (authoritative DB schema).
 * Prefix all tables with "tenancy_" to avoid conflicts.
 *
 * NOTE: eslint no-restricted-syntax is disabled here because these tables
 * ARE the canonical tenancy source of truth. The organization_id / team_id
 * columns in memberships, audit_logs, invitations, and teams are internal
 * FK references to sibling tenancy tables — not cross-domain tenant columns
 * that should use tenancyColumns spreads.
 */

/* eslint-disable no-restricted-syntax */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
  check,
  uuid,
} from "drizzle-orm/pg-core";

// Organizations
export const tenancyOrganizations = pgTable(
  "tenancy_organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    logo: text("logo"),
    settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("tenancy_organizations_slug_idx").on(table.slug),
    createdByIdx: index("tenancy_organizations_created_by_idx").on(table.createdBy),
    isActiveIdx: index("tenancy_organizations_is_active_idx").on(table.isActive),
  })
);

export type TenancyOrganizationRow = typeof tenancyOrganizations.$inferSelect;
export type TenancyOrganizationInsert = typeof tenancyOrganizations.$inferInsert;

// Teams (org-scoped or standalone)
export const tenancyTeams = pgTable(
  "tenancy_teams",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(
      () => tenancyOrganizations.id,
      { onDelete: "cascade" }
    ),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    parentId: text("parent_id"),
    settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    orgIdx: index("tenancy_teams_organization_id_idx").on(table.organizationId),
    // orgSlugIdx: partial unique indexes in migration (standalone: slug global; org-scoped: slug per org)
    parentIdx: index("tenancy_teams_parent_id_idx").on(table.parentId),
    isActiveIdx: index("tenancy_teams_is_active_idx").on(table.isActive),
    parentFk: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
    }).onDelete("set null"),
  })
);

export type TenancyTeamRow = typeof tenancyTeams.$inferSelect;
export type TenancyTeamInsert = typeof tenancyTeams.$inferInsert;

// Memberships (user ↔ org, or user ↔ standalone team)
export const tenancyMemberships = pgTable(
  "tenancy_memberships",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id").references(
      () => tenancyOrganizations.id,
      { onDelete: "cascade" }
    ),
    teamId: text("team_id").references(() => tenancyTeams.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    permissions: jsonb("permissions").$type<Record<string, boolean>>().default({}),
    invitedBy: text("invited_by"),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }).defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    userIdx: index("tenancy_memberships_user_id_idx").on(table.userId),
    orgIdx: index("tenancy_memberships_organization_id_idx").on(table.organizationId),
    teamIdx: index("tenancy_memberships_team_id_idx").on(table.teamId),
    userOrgIdx: index("tenancy_memberships_user_org_idx").on(
      table.userId,
      table.organizationId,
      table.teamId
    ),
    isActiveIdx: index("tenancy_memberships_is_active_idx").on(table.isActive),
    membershipCheck: check(
      "tenancy_memberships_org_or_team_check",
      sql`(${table.organizationId} IS NOT NULL OR ${table.teamId} IS NOT NULL)`
    ),
  })
);

export type TenancyMembershipRow = typeof tenancyMemberships.$inferSelect;
export type TenancyMembershipInsert = typeof tenancyMemberships.$inferInsert;

// Tenant design system (per-tenant theming)
export const tenancyTenantDesignSystem = pgTable(
  "tenancy_tenant_design_system",
  {
    tenantId: text("tenant_id").primaryKey(),
    settings: jsonb("settings")
      .$type<{
        style?: string;
        baseColor?: string;
        brandColor?: string;
        theme?: string;
        menuColor?: string;
        menuAccent?: string;
        menuColorLight?: string;
        menuColorDark?: string;
        menuAccentLight?: string;
        menuAccentDark?: string;
        font?: string;
        radius?: number;
      }>()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("tenancy_tenant_design_system_tenant_id_idx").on(table.tenantId),
  })
);

export type TenancyTenantDesignSystemRow = typeof tenancyTenantDesignSystem.$inferSelect;
export type TenancyTenantDesignSystemInsert =
  typeof tenancyTenantDesignSystem.$inferInsert;

// Audit logs (governance and compliance tracking)
export const tenancyAuditLogs = pgTable(
  "tenancy_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Actor information
    actorId: text("actor_id").notNull(),
    actorEmail: text("actor_email"),
    // Action details
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    // Context
    organizationId: text("organization_id").references(
      () => tenancyOrganizations.id,
      { onDelete: "cascade" }
    ),
    teamId: text("team_id").references(() => tenancyTeams.id, { onDelete: "cascade" }),
    // Metadata
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    // Timestamp
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    actorIdx: index("idx_audit_logs_actor").on(table.actorId, table.createdAt),
    resourceIdx: index("idx_audit_logs_resource").on(
      table.resourceType,
      table.resourceId,
      table.createdAt
    ),
    orgIdx: index("idx_audit_logs_organization").on(table.organizationId, table.createdAt),
    teamIdx: index("idx_audit_logs_team").on(table.teamId, table.createdAt),
    actionIdx: index("idx_audit_logs_action").on(table.action, table.createdAt),
    orgResourceIdx: index("idx_audit_logs_org_resource").on(
      table.organizationId,
      table.resourceType,
      table.createdAt
    ),
  })
);

export type TenancyAuditLogRow = typeof tenancyAuditLogs.$inferSelect;
export type TenancyAuditLogInsert = typeof tenancyAuditLogs.$inferInsert;
// Invitations (email-based member invitations)
export const tenancyInvitations = pgTable(
  "tenancy_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Invitation details
    email: text("email").notNull(),
    organizationId: text("organization_id").references(
      () => tenancyOrganizations.id,
      { onDelete: "cascade" }
    ),
    teamId: text("team_id").references(() => tenancyTeams.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    // Token for acceptance
    token: text("token").notNull().unique(),
    // Invitation metadata
    invitedBy: text("invited_by").notNull(),
    message: text("message"),
    // Status tracking
    status: text("status").notNull().default("pending"),
    acceptedBy: text("accepted_by"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    // Expiry
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    // Unique constraint: One pending invitation per email+org/team
    uniquePendingIdx: uniqueIndex("idx_tenancy_invitations_unique_pending").on(
      table.email,
      table.organizationId,
      table.teamId
    ).where(sql`${table.status} = 'pending'`),
    // Token lookups
    tokenIdx: index("idx_tenancy_invitations_token").on(table.token).where(
      sql`${table.status} = 'pending'`
    ),
    // Pending invitations by org
    orgPendingIdx: index("idx_tenancy_invitations_org_pending").on(
      table.organizationId,
      table.createdAt
    ).where(sql`${table.organizationId} IS NOT NULL AND ${table.status} = 'pending'`),
    // Pending invitations by team
    teamPendingIdx: index("idx_tenancy_invitations_team_pending").on(
      table.teamId,
      table.createdAt
    ).where(sql`${table.teamId} IS NOT NULL AND ${table.status} = 'pending'`),
    // Email lookups
    emailIdx: index("idx_tenancy_invitations_email").on(
      table.email,
      table.status,
      table.createdAt
    ),
    // Expiry cleanup
    expiresAtIdx: index("idx_tenancy_invitations_expires_at").on(table.expiresAt).where(
      sql`${table.status} = 'pending'`
    ),
    // Constraints
    orgOrTeamCheck: check(
      "invitation_org_or_team_check",
      sql`(${table.organizationId} IS NOT NULL AND ${table.teamId} IS NULL) OR (${table.organizationId} IS NULL AND ${table.teamId} IS NOT NULL)`
    ),
    statusCheck: check(
      "invitation_status_check",
      sql`${table.status} IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')`
    ),
  })
);

export type TenancyInvitationRow = typeof tenancyInvitations.$inferSelect;
export type TenancyInvitationInsert = typeof tenancyInvitations.$inferInsert;