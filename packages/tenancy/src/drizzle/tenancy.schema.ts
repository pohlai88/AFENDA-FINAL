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
  uniqueIndex,
  foreignKey,
  check,
  uuid,
  pgPolicy,
} from "drizzle-orm/pg-core";
import {
  timestamps,
  createdAtOnly,
  idx,
  uidx,
  authenticatedRole,
} from "@afenda/shared/drizzle/manifest";

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
    ...timestamps(),
  },
  (t) => [
    uidx("tenancy_organizations", "slug").on(t.slug),
    idx("tenancy_organizations", "created_by").on(t.createdBy),
    idx("tenancy_organizations", "is_active").on(t.isActive),
    // RLS: Member read, authenticated insert, owner update/delete
    pgPolicy("org_select_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.organization_id = ${t.id}
          AND m.user_id = auth.user_id()
          AND m.is_active = true
      )`,
    }),
    pgPolicy("org_insert_authenticated", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.user_id() IS NOT NULL`,
    }),
    pgPolicy("org_update_owner", {
      for: "update",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.organization_id = ${t.id}
          AND m.user_id = auth.user_id()
          AND m.role = 'owner'
          AND m.is_active = true
      )`,
    }),
    pgPolicy("org_delete_owner", {
      for: "delete",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.organization_id = ${t.id}
          AND m.user_id = auth.user_id()
          AND m.role = 'owner'
          AND m.is_active = true
      )`,
    }),
  ]
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
    ...timestamps(),
  },
  (t) => [
    idx("tenancy_teams", "organization_id").on(t.organizationId),
    // Note: partial unique indexes in migration (standalone: slug global; org-scoped: slug per org)
    idx("tenancy_teams", "parent_id").on(t.parentId),
    idx("tenancy_teams", "is_active").on(t.isActive),
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete("set null"),
    // RLS: Team/org member read, org member insert, admin update/delete
    pgPolicy("team_select_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.user_id = auth.user_id()
          AND m.is_active = true
          AND (m.team_id = ${t.id} OR m.organization_id = ${t.organizationId})
      )`,
    }),
    pgPolicy("team_insert_org_member", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.organization_id = ${t.organizationId}
          AND m.user_id = auth.user_id()
          AND m.is_active = true
      )`,
    }),
    pgPolicy("team_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.user_id = auth.user_id()
          AND m.is_active = true
          AND (
            (m.team_id = ${t.id} AND m.role IN ('owner', 'admin'))
            OR (m.organization_id = ${t.organizationId} AND m.role = 'owner')
          )
      )`,
    }),
    pgPolicy("team_delete_admin", {
      for: "delete",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.user_id = auth.user_id()
          AND m.is_active = true
          AND (
            (m.team_id = ${t.id} AND m.role IN ('owner', 'admin'))
            OR (m.organization_id = ${t.organizationId} AND m.role = 'owner')
          )
      )`,
    }),
  ]
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
    ...timestamps(),
  },
  (t) => [
    idx("tenancy_memberships", "user_id").on(t.userId),
    idx("tenancy_memberships", "organization_id").on(t.organizationId),
    idx("tenancy_memberships", "team_id").on(t.teamId),
    idx("tenancy_memberships", "user_org").on(t.userId, t.organizationId, t.teamId),
    idx("tenancy_memberships", "is_active").on(t.isActive),
    check(
      "tenancy_memberships_org_or_team_check",
      sql`(${t.organizationId} IS NOT NULL OR ${t.teamId} IS NOT NULL)`
    ),
    // RLS: Self/co-member read, admin insert/update, self/admin delete
    pgPolicy("membership_select_visible", {
      for: "select",
      to: authenticatedRole,
      using: sql`
        ${t.userId} = auth.user_id()
        OR EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.user_id = auth.user_id()
            AND m.is_active = true
            AND (
              (m.organization_id IS NOT NULL AND m.organization_id = ${t.organizationId})
              OR (m.team_id IS NOT NULL AND m.team_id = ${t.teamId})
            )
        )
      `,
    }),
    pgPolicy("membership_insert_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`
        (${t.organizationId} IS NOT NULL AND EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.organization_id = ${t.organizationId}
            AND m.user_id = auth.user_id()
            AND m.role = 'owner'
            AND m.is_active = true
        ))
        OR (${t.teamId} IS NOT NULL AND EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.user_id = auth.user_id()
            AND m.is_active = true
            AND (
              (m.team_id = ${t.teamId} AND m.role IN ('owner', 'admin'))
              OR (m.organization_id = (SELECT t2.organization_id FROM tenancy_teams t2 WHERE t2.id = ${t.teamId}) AND m.role = 'owner')
            )
        ))
      `,
    }),
    pgPolicy("membership_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: sql`
        (${t.organizationId} IS NOT NULL AND EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.organization_id = ${t.organizationId}
            AND m.user_id = auth.user_id()
            AND m.role = 'owner'
            AND m.is_active = true
        ))
        OR (${t.teamId} IS NOT NULL AND EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.user_id = auth.user_id()
            AND m.is_active = true
            AND (
              (m.team_id = ${t.teamId} AND m.role IN ('owner', 'admin'))
              OR (m.organization_id = (SELECT t2.organization_id FROM tenancy_teams t2 WHERE t2.id = ${t.teamId}) AND m.role = 'owner')
            )
        ))
      `,
    }),
    pgPolicy("membership_delete_self_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: sql`
        ${t.userId} = auth.user_id()
        OR (${t.organizationId} IS NOT NULL AND EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.organization_id = ${t.organizationId}
            AND m.user_id = auth.user_id()
            AND m.role = 'owner'
            AND m.is_active = true
        ))
        OR (${t.teamId} IS NOT NULL AND EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.user_id = auth.user_id()
            AND m.is_active = true
            AND (
              (m.team_id = ${t.teamId} AND m.role IN ('owner', 'admin'))
              OR (m.organization_id = (SELECT t2.organization_id FROM tenancy_teams t2 WHERE t2.id = ${t.teamId}) AND m.role = 'owner')
            )
        ))
      `,
    }),
  ]
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
    ...timestamps(),
  },
  (t) => [
    idx("tenancy_tenant_design_system", "tenant_id").on(t.tenantId),
    // RLS: Member read, admin insert/update
    pgPolicy("design_select_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.user_id = auth.user_id()
          AND m.is_active = true
          AND m.organization_id = ${t.tenantId}
      )`,
    }),
    pgPolicy("design_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.user_id = auth.user_id()
          AND m.is_active = true
          AND m.organization_id = ${t.tenantId}
          AND m.role IN ('owner', 'admin')
      )`,
    }),
    pgPolicy("design_insert_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.user_id = auth.user_id()
          AND m.is_active = true
          AND m.organization_id = ${t.tenantId}
          AND m.role IN ('owner', 'admin')
      )`,
    }),
  ]
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
    ...createdAtOnly(),
  },
  (t) => [
    idx("audit_logs", "actor").on(t.actorId, t.createdAt),
    idx("audit_logs", "resource").on(t.resourceType, t.resourceId, t.createdAt),
    idx("audit_logs", "organization").on(t.organizationId, t.createdAt),
    idx("audit_logs", "team").on(t.teamId, t.createdAt),
    idx("audit_logs", "action").on(t.action, t.createdAt),
    idx("audit_logs", "org_resource").on(t.organizationId, t.resourceType, t.createdAt),
    // RLS: Self/admin read, authenticated insert (append-only)
    pgPolicy("audit_select_scoped", {
      for: "select",
      to: authenticatedRole,
      using: sql`
        ${t.actorId} = auth.user_id()
        OR EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.user_id = auth.user_id()
            AND m.is_active = true
            AND m.organization_id = ${t.organizationId}
            AND m.role IN ('owner', 'admin')
        )
      `,
    }),
    pgPolicy("audit_insert_authenticated", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.user_id() IS NOT NULL`,
    }),
  ]
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
    ...timestamps(),
  },
  (t) => [
    // Unique constraint: One pending invitation per email+org/team
    uidx("tenancy_invitations", "unique_pending").on(
      t.email,
      t.organizationId,
      t.teamId
    ).where(sql`${t.status} = 'pending'`),
    // Token lookups
    idx("tenancy_invitations", "token").on(t.token).where(
      sql`${t.status} = 'pending'`
    ),
    // Pending invitations by org
    idx("tenancy_invitations", "org_pending").on(
      t.organizationId,
      t.createdAt
    ).where(sql`${t.organizationId} IS NOT NULL AND ${t.status} = 'pending'`),
    // Pending invitations by team
    idx("tenancy_invitations", "team_pending").on(
      t.teamId,
      t.createdAt
    ).where(sql`${t.teamId} IS NOT NULL AND ${t.status} = 'pending'`),
    // Email lookups
    idx("tenancy_invitations", "email").on(
      t.email,
      t.status,
      t.createdAt
    ),
    // Expiry cleanup
    idx("tenancy_invitations", "expires_at").on(t.expiresAt).where(
      sql`${t.status} = 'pending'`
    ),
    // Constraints
    check(
      "invitation_org_or_team_check",
      sql`(${t.organizationId} IS NOT NULL AND ${t.teamId} IS NULL) OR (${t.organizationId} IS NULL AND ${t.teamId} IS NOT NULL)`
    ),
    check(
      "invitation_status_check",
      sql`${t.status} IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')`
    ),
    // RLS: Inviter/invitee/admin read, admin insert, inviter/invitee/admin update
    pgPolicy("invitation_select_participant", {
      for: "select",
      to: authenticatedRole,
      using: sql`
        ${t.invitedBy} = auth.user_id()
        OR ${t.email} = (SELECT u.email FROM neon_auth."user" u WHERE u.id::text = auth.user_id())
        OR EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.user_id = auth.user_id()
            AND m.is_active = true
            AND (
              (m.organization_id = ${t.organizationId} AND m.role IN ('owner', 'admin'))
              OR (m.team_id = ${t.teamId} AND m.role IN ('owner', 'admin'))
            )
        )
      `,
    }),
    pgPolicy("invitation_insert_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM tenancy_memberships m
        WHERE m.user_id = auth.user_id()
          AND m.is_active = true
          AND (
            (m.organization_id = ${t.organizationId} AND m.role IN ('owner', 'admin'))
            OR (m.team_id = ${t.teamId} AND m.role IN ('owner', 'admin'))
          )
      )`,
    }),
    pgPolicy("invitation_update_participant", {
      for: "update",
      to: authenticatedRole,
      using: sql`
        ${t.invitedBy} = auth.user_id()
        OR ${t.email} = (SELECT u.email FROM neon_auth."user" u WHERE u.id::text = auth.user_id())
        OR EXISTS (
          SELECT 1 FROM tenancy_memberships m
          WHERE m.user_id = auth.user_id()
            AND m.is_active = true
            AND (
              (m.organization_id = ${t.organizationId} AND m.role IN ('owner', 'admin'))
              OR (m.team_id = ${t.teamId} AND m.role IN ('owner', 'admin'))
            )
        )
      `,
    }),
  ]
);

export type TenancyInvitationRow = typeof tenancyInvitations.$inferSelect;
export type TenancyInvitationInsert = typeof tenancyInvitations.$inferInsert;