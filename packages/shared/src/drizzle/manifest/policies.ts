/**
 * Schema Manifest — RLS Policy Factories
 * 
 * Standardized policy patterns for Neon Auth + multi-tenant RLS.
 * 
 * Based on:
 * - Migration 0011 (tenancy RLS policies)
 * - afenda-template policy helpers
 * - Neon multitenancy guide best practices
 * 
 * @see https://neon.tech/docs/guides/neon-authorize
 * @see https://orm.drizzle.team/docs/neon#row-level-security
 */

import { sql, type SQL as _SQL } from "drizzle-orm";
import {
  pgPolicy,
  type AnyPgColumn,
  type PgPolicyConfig as _PgPolicyConfig,
  type PgTable as _PgTable,
} from "drizzle-orm/pg-core";
import { authUid, crudPolicy } from "drizzle-orm/neon";
import { authenticatedRole, anonymousRole as _anonymousRole } from "./roles";

/**
 * Tenant membership policy — SELECT/UPDATE/DELETE
 * 
 * User must be an active member of the tenant (organization).
 * Checks tenancy_memberships table.
 */
export function policyTenantMemberRead(
  tableName: string,
  t: { tenantId: AnyPgColumn }
) {
  return pgPolicy(`${tableName}_tenant_select`, {
    for: "select",
    to: authenticatedRole,
    using: sql`EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.organization_id = ${t.tenantId}
        AND m.user_id = auth.user_id()
        AND m.is_active = true
    )`,
  });
}

/**
 * Tenant membership policy — INSERT
 * 
 * User can only insert rows for tenants they're an active member of.
 */
export function policyTenantMemberInsert(
  tableName: string,
  t: { tenantId: AnyPgColumn }
) {
  return pgPolicy(`${tableName}_tenant_insert`, {
    for: "insert",
    to: authenticatedRole,
    withCheck: sql`EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.organization_id = ${t.tenantId}
        AND m.user_id = auth.user_id()
        AND m.is_active = true
    )`,
  });
}

/**
 * Tenant membership policy — UPDATE
 */
export function policyTenantMemberUpdate(
  tableName: string,
  t: { tenantId: AnyPgColumn }
) {
  return pgPolicy(`${tableName}_tenant_update`, {
    for: "update",
    to: authenticatedRole,
    using: sql`EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.organization_id = ${t.tenantId}
        AND m.user_id = auth.user_id()
        AND m.is_active = true
    )`,
    withCheck: sql`EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.organization_id = ${t.tenantId}
        AND m.user_id = auth.user_id()
        AND m.is_active = true
    )`,
  });
}

/**
 * Tenant membership policy — DELETE
 */
export function policyTenantMemberDelete(
  tableName: string,
  t: { tenantId: AnyPgColumn }
) {
  return pgPolicy(`${tableName}_tenant_delete`, {
    for: "delete",
    to: authenticatedRole,
    using: sql`EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.organization_id = ${t.tenantId}
        AND m.user_id = auth.user_id()
        AND m.is_active = true
    )`,
  });
}

/**
 * User owns row policy — all operations
 * 
 * Uses Neon authUid() helper to check userId column matches auth.user_id().
 */
export function policyUserOwnsRow(
  tableName: string,
  t: { userId: AnyPgColumn }
) {
  return pgPolicy(`${tableName}_user_owns`, {
    for: "all",
    to: authenticatedRole,
    using: authUid(t.userId),
    withCheck: authUid(t.userId),
  });
}

/**
 * Team-scoped policy — SELECT
 * 
 * User must be an active member of the team.
 */
export function policyTeamMember(
  tableName: string,
  t: { teamId: AnyPgColumn }
) {
  return pgPolicy(`${tableName}_team_select`, {
    for: "select",
    to: authenticatedRole,
    using: sql`EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.team_id = ${t.teamId}
        AND m.user_id = auth.user_id()
        AND m.is_active = true
    )`,
  });
}

/**
 * Admin-only policy — using crudPolicy()
 * 
 * Allow admins read-only or full CRUD via Neon helper.
 */
export function policyAdminReadOnly(_tableName: string) {
  return crudPolicy({
    role: authenticatedRole,
    read: sql`EXISTS (
      SELECT 1 FROM tenancy_memberships m
      WHERE m.user_id = auth.user_id()
        AND m.role = 'owner'
        AND m.is_active = true
    )`,
    modify: false,
  });
}

/**
 * Public read policy — anyone can SELECT, only authenticated can modify
 */
export function policyPublicRead(tableName: string) {
  return [
    pgPolicy(`${tableName}_public_select`, {
      for: "select",
      to: "public",
      using: sql`true`,
    }),
  ];
}

/**
 * Audit log policy — insert-only for authenticated users
 */
export function policyAuditLogInsert(tableName: string) {
  return pgPolicy(`${tableName}_audit_insert`, {
    for: "insert",
    to: authenticatedRole,
    withCheck: sql`auth.user_id() IS NOT NULL`,
  });
}

/**
 * Standard domain table policies — tenant + user
 * 
 * Returns array of policies for tenant-scoped + user-scoped tables.
 * Most common pattern for domain tables.
 */
export function domainPolicies(
  tableName: string,
  t: { tenantId: AnyPgColumn; userId: AnyPgColumn }
) {
  return [
    policyTenantMemberRead(tableName, t),
    policyTenantMemberInsert(tableName, t),
    policyTenantMemberUpdate(tableName, t),
    policyTenantMemberDelete(tableName, t),
    policyUserOwnsRow(tableName, t),
  ];
}

/**
 * Standard domain table policies — tenant-only (no user ownership)
 * 
 * For shared resources within a tenant (tags, collections, etc.)
 */
export function domainPoliciesTenantOnly(
  tableName: string,
  t: { tenantId: AnyPgColumn }
) {
  return [
    policyTenantMemberRead(tableName, t),
    policyTenantMemberInsert(tableName, t),
    policyTenantMemberUpdate(tableName, t),
    policyTenantMemberDelete(tableName, t),
  ];
}
