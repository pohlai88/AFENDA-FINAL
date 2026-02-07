/**
 * @layer domain (tenancy)
 * @responsibility Tenancy domain tables (authoritative DB schema).
 * Prefix all tables with "tenancy_" to avoid conflicts.
 */

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
