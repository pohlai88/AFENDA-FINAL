import { sql, type SQL } from "drizzle-orm";
import { AnyPgColumn, pgPolicy, type PgPolicyConfig, type PgPolicyToOption } from "drizzle-orm/pg-core";
import { authUid, authenticatedRole, crudPolicy } from "drizzle-orm/neon";

/**
 * Policy helpers (Neon wrapper + raw pgPolicy).
 *
 * Best practice:
 * - Keep policy generation centralized.
 * - Prefer Neon helpers when targeting Neon roles/functions.
 */

/**
 * Allow authenticated users to read (select) only rows where the given userIdColumn matches neon_identity auth.user_id().
 * (Neon docs: auth.user_id())
 */
export function policyUserOwnsRow(userIdColumn: AnyPgColumn, name = "policy_user_owns_row") {
  return pgPolicy(name, {
    for: "all",
    to: authenticatedRole,
    using: authUid(userIdColumn),
    withCheck: authUid(userIdColumn),
  } satisfies PgPolicyConfig);
}

/**
 * Common pattern: allow a role full CRUD read-only or modify-only via Neon `crudPolicy`.
 * read=true means select allowed; modify=true means insert/update/delete allowed.
 */
export function policyCrudForRole(opts: { role?: PgPolicyToOption; read: SQL | boolean | null; modify: SQL | boolean | null }) {
  return crudPolicy({
    role: opts.role ?? authenticatedRole,
    read: opts.read,
    modify: opts.modify,
  }).filter(Boolean);
}

/**
 * Tenant policy via a session variable.
 *
 * This is a generic Postgres RLS technique:
 * - server sets `set_config('app.tenant_id', '<tenant>', true)`
 * - policy enforces tenantId = current_setting('app.tenant_id', true)
 *
 * NOTE: You must set the session var in your transaction/request.
 */
export function policyTenantIsCurrent(tenantIdColumn: AnyPgColumn, name = "policy_tenant_is_current") {
  return pgPolicy(name, {
    for: "all",
    to: authenticatedRole,
    using: sql`${tenantIdColumn} = current_setting('app.tenant_id', true)`,
    withCheck: sql`${tenantIdColumn} = current_setting('app.tenant_id', true)`,
  });
}

/**
 * Time-based policy: allow access only during specific timeframes.
 */
export function policyTimeWindow(
  startTimeColumn: AnyPgColumn,
  endTimeColumn: AnyPgColumn,
  name = "policy_time_window"
) {
  return pgPolicy(name, {
    for: "select",
    to: authenticatedRole,
    using: sql`NOW() BETWEEN ${startTimeColumn} AND ${endTimeColumn}`,
  });
}

/**
 * Soft delete policy: exclude deleted records from SELECT.
 */
export function policyExcludeDeleted(isDeletedColumn: AnyPgColumn, name = "policy_exclude_deleted") {
  return pgPolicy(name, {
    for: "select",
    to: authenticatedRole,
    using: sql`${isDeletedColumn} = false`,
  });
}

/**
 * Organization membership policy: user must be a member of the organization.
 */
export function policyOrgMembership(
  orgIdColumn: AnyPgColumn,
  opts: {
    membershipTable?: string;
    orgColumn?: string;
    userColumn?: string;
    activeColumn?: string;
    name?: string;
  } = {}
) {
  const {
    membershipTable = "memberships",
    orgColumn = "organization_id",
    userColumn = "user_id",
    activeColumn = "is_active",
    name = "policy_org_membership",
  } = opts;

  const orgExpression = sql`membership.${sql.identifier(orgColumn)}`;
  const userExpression = sql`membership.${sql.identifier(userColumn)}`;
  const activeExpression = sql`membership.${sql.identifier(activeColumn)}`;

  return pgPolicy(name, {
    for: "all",
    to: authenticatedRole,
    using: sql`EXISTS (
      SELECT 1 FROM ${sql.identifier(membershipTable)} AS membership
      WHERE ${orgExpression} = ${orgIdColumn}
      AND ${userExpression} = auth.user_id()
      AND (${activeExpression} IS NULL OR ${activeExpression} = true)
    )`,
    withCheck: sql`EXISTS (
      SELECT 1 FROM ${sql.identifier(membershipTable)} AS membership
      WHERE ${orgExpression} = ${orgIdColumn}
      AND ${userExpression} = auth.user_id()
      AND (${activeExpression} IS NULL OR ${activeExpression} = true)
    )`,
  });
}

/**
 * Role hierarchy policy: enforce minimum role level.
 */
export function policyMinimumRole(
  opts: {
    userRoleColumn: AnyPgColumn;
    requiredRole: string;
    roleHierarchy?: string[];
  },
  name = "policy_minimum_role"
) {
  const hierarchy = opts.roleHierarchy || ["viewer", "editor", "admin", "owner"];
  const requiredLevel = hierarchy.indexOf(opts.requiredRole);

  return pgPolicy(name, {
    for: "all",
    to: authenticatedRole,
    using: sql`ARRAY_POSITION(ARRAY[${sql.join(hierarchy.map((r) => sql.raw(`'${r}'`)), sql`, `)}]::text[], ${opts.userRoleColumn}) >= ${requiredLevel}`,
  });
}

/**
 * Audit log policy: always allow insert, restrict updates/deletes.
 */
export function policyAuditLog(name = "policy_audit_log") {
  return pgPolicy(name, {
    for: "insert",
    to: authenticatedRole,
    withCheck: sql`true`,
  });
}

/**
 * Read-only policy: allow SELECT but block modifications.
 */
export function policyReadOnly(name = "policy_read_only") {
  return pgPolicy(name, {
    for: "select",
    to: authenticatedRole,
    using: sql`true`,
  });
}

/**
 * Public read policy: anyone can read, only authenticated can modify.
 */
export function policyPublicRead(name = "policy_public_read") {
  return [
    pgPolicy(`${name}_select`, {
      for: "select",
      to: "public",
      using: sql`true`,
    }),
    pgPolicy(`${name}_modify`, {
      for: "all",
      to: authenticatedRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ];
}

/**
 * Team-based access: user must be a member of the team.
 */
export function policyTeamAccess(
  teamIdColumn: AnyPgColumn,
  opts: {
    membershipTable?: string;
    teamColumn?: string;
    userColumn?: string;
    activeColumn?: string;
    name?: string;
  } = {}
) {
  const {
    membershipTable = "memberships",
    teamColumn = "team_id",
    userColumn = "user_id",
    activeColumn = "is_active",
    name = "policy_team_access",
  } = opts;

  const teamExpression = sql`membership.${sql.identifier(teamColumn)}`;
  const userExpression = sql`membership.${sql.identifier(userColumn)}`;
  const activeExpression = sql`membership.${sql.identifier(activeColumn)}`;

  return pgPolicy(name, {
    for: "all",
    to: authenticatedRole,
    using: sql`EXISTS (
      SELECT 1 FROM ${sql.identifier(membershipTable)} AS membership
      WHERE ${teamExpression} = ${teamIdColumn}
      AND ${userExpression} = auth.user_id()
      AND (${activeExpression} IS NULL OR ${activeExpression} = true)
    )`,
    withCheck: sql`EXISTS (
      SELECT 1 FROM ${sql.identifier(membershipTable)} AS membership
      WHERE ${teamExpression} = ${teamIdColumn}
      AND ${userExpression} = auth.user_id()
      AND (${activeExpression} IS NULL OR ${activeExpression} = true)
    )`,
  });
}
