/**
 * @domain tenancy
 * @layer server
 * @responsibility RBAC: role hierarchy and authorization assertions
 * Use package logger for RBAC failures; no console.* (01-AGENT)
 */

import "server-only";

import { eq, and } from "drizzle-orm";
import { tenancyMemberships } from "@afenda/tenancy/drizzle";
import { db } from "@afenda/shared/server/db";
import type { Database } from "@afenda/shared/server/db";
import { tenancyLogger } from "../logger";

const ORG_ROLE_ORDER = ["member", "admin", "owner"] as const;
const TEAM_ROLE_ORDER = ["member", "lead"] as const;

export type OrgRole = (typeof ORG_ROLE_ORDER)[number];
export type TeamRole = (typeof TEAM_ROLE_ORDER)[number];

function roleLevel(role: string, order: readonly string[]): number {
  const idx = order.indexOf(role);
  return idx >= 0 ? idx : -1;
}

function hasMinRole(userRole: string, minRole: string, order: readonly string[]): boolean {
  return roleLevel(userRole, order) >= roleLevel(minRole, order);
}

export async function assertUserHasOrgRole(
  userId: string,
  orgId: string,
  minRole: OrgRole,
  dbx: Database = db
): Promise<void> {
  const [membership] = await dbx
    .select({ role: tenancyMemberships.role })
    .from(tenancyMemberships)
    .where(
      and(
        eq(tenancyMemberships.userId, userId),
        eq(tenancyMemberships.organizationId, orgId),
        eq(tenancyMemberships.isActive, true)
      )
    );

  if (!membership) {
    tenancyLogger.warn(
      { userId, orgId, minRole },
      "RBAC: User has no org membership"
    );
    throw new Error("Forbidden: insufficient permissions");
  }

  if (!hasMinRole(membership.role, minRole, ORG_ROLE_ORDER)) {
    tenancyLogger.warn(
      { userId, orgId, userRole: membership.role, minRole },
      "RBAC: User role below required"
    );
    throw new Error("Forbidden: insufficient permissions");
  }
}

export async function assertUserHasTeamRole(
  userId: string,
  teamId: string,
  minRole: TeamRole,
  dbx: Database = db
): Promise<void> {
  const [membership] = await dbx
    .select({ role: tenancyMemberships.role })
    .from(tenancyMemberships)
    .where(
      and(
        eq(tenancyMemberships.userId, userId),
        eq(tenancyMemberships.teamId, teamId),
        eq(tenancyMemberships.isActive, true)
      )
    );

  if (!membership) {
    tenancyLogger.warn(
      { userId, teamId, minRole },
      "RBAC: User has no team membership"
    );
    throw new Error("Forbidden: insufficient permissions");
  }

  if (!hasMinRole(membership.role, minRole, TEAM_ROLE_ORDER)) {
    tenancyLogger.warn(
      { userId, teamId, userRole: membership.role, minRole },
      "RBAC: User role below required"
    );
    throw new Error("Forbidden: insufficient permissions");
  }
}
