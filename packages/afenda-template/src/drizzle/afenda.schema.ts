import { boolean, foreignKey, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { policyExcludeDeleted, policyOrgMembership, policyPublicRead, policyTenantIsCurrent, policyUserOwnsRow } from "./drizzle.policies.neon";
import { pkUuid, traceCols, metaCols, actorCols, timeCols, softDeleteCols } from "./_drizzle.core.table";
import { idx, uidx } from "./_drizzle.core.index";

/**
 * Afenda domain tables (authoritative DB schema slice).
 * These tables intentionally showcase:
 * - Shared column groups (tenant/time/actor/meta/soft-delete)
 * - Deterministic FK + index naming
 * - RLS policies declared alongside the table definition
 */

export const afendaTenants = pgTable(
  "afenda_tenants",
  {
    id: pkUuid(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    contactEmail: text("contact_email"),
    ...metaCols<{ logoUrl?: string; palette?: string }>(),
    ...traceCols(),
    ...actorCols(),
    ...timeCols(),
  },
  (t) => [
    uidx("afenda_tenants_slug_uidx").on(t.slug),
    idx("afenda_tenants_status_idx").on(t.status),
    ...policyPublicRead("afenda_tenants_public"),
  ]
);

export const afendaUsers = pgTable(
  "afenda_users",
  {
    id: pkUuid(),
    tenantId: text("tenant_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    role: text("role").notNull().default("member"),
    status: text("status").notNull().default("active"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" }),
    ...traceCols(),
    ...actorCols(),
    ...softDeleteCols(),
    ...timeCols(),
  },
  (t) => [
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [afendaTenants.id],
      name: "afenda_users_tenant_id_fk",
    }).onDelete("cascade"),
    uidx("afenda_users_email_uidx").on(t.tenantId, t.email),
    idx("afenda_users_role_idx").on(t.tenantId, t.role),
    policyTenantIsCurrent(t.tenantId, "afenda_users_tenant_policy"),
    policyUserOwnsRow(t.id, "afenda_users_self_policy"),
    policyExcludeDeleted(t.isDeleted, "afenda_users_exclude_deleted"),
  ]
);

export const afendaTenantMembers = pgTable(
  "afenda_tenant_members",
  {
    id: pkUuid(),
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull().default("member"),
    isActive: boolean("is_active").notNull().default(true),
    ...actorCols(),
    ...timeCols(),
  },
  (t) => [
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [afendaTenants.id],
      name: "afenda_tenant_members_tenant_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [afendaUsers.id],
      name: "afenda_tenant_members_user_id_fk",
    }).onDelete("cascade"),
    uidx("afenda_tenant_members_unique_uidx").on(t.tenantId, t.userId),
    idx("afenda_tenant_members_role_idx").on(t.tenantId, t.role),
    policyTenantIsCurrent(t.tenantId, "afenda_members_tenant_policy"),
    policyOrgMembership(t.tenantId, {
      membershipTable: "afenda_tenant_members",
      orgColumn: "tenant_id",
      userColumn: "user_id",
      activeColumn: "is_active",
      name: "afenda_membership_guard",
    }),
  ]
);
