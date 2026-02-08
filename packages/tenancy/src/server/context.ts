/**
 * @domain tenancy
 * @layer server
 * @responsibility Tenant context resolution and query scoping
 * Phase 4, Step 4.3: Utilities for automatic tenant-based filtering
 */

import "server-only";

import { headers } from "next/headers";
import { getAuthContext } from "@afenda/orchestra";
import { tenancyMembershipService } from "./memberships/service";
import type { Database } from "@afenda/shared/server/db";
import { db } from "@afenda/shared/server/db";
import { and, eq, type SQL, sql } from "drizzle-orm";
import { tenancyLogger } from "../logger";

/**
 * Tenant context extracted from request headers or session
 */
export interface TenantContext {
  /** Current organization ID (null if no active org) */
  organizationId: string | null;
  /** Current team ID (null if no active team) */
  teamId: string | null;
  /** User ID (from auth context) */
  userId: string | null;
  /** Whether user is a member of the current org */
  isOrgMember: boolean;
  /** Whether user is a member of the current team */
  isTeamMember: boolean;
}

/**
 * Header constants for tenant context
 */
export const TENANT_HEADERS = {
  ORG_ID: "x-tenant-org-id",
  TEAM_ID: "x-tenant-team-id",
  USER_ID: "x-user-id",
} as const;

/**
 * Get the active tenant context from request headers
 * 
 * This reads tenant IDs from headers set by middleware and validates
 * that the current user is actually a member of those tenants.
 * 
 * @returns Tenant context with org/team IDs and membership validation
 * 
 * @example
 * ```ts
 * const context = await getTenantOrgContext();
 * if (!context.isOrgMember) {
 *   throw new Error("Not a member of this organization");
 * }
 * const tasks = await db.select().from(tasks)
 *   .where(eq(tasks.organizationId, context.organizationId));
 * ```
 */
export async function getTenantOrgContext(): Promise<TenantContext> {
  const headersList = await headers();
  const auth = await getAuthContext();
  
  const organizationId = headersList.get(TENANT_HEADERS.ORG_ID);
  const teamId = headersList.get(TENANT_HEADERS.TEAM_ID);
  const userId = auth.userId ?? null;

  // If no user authenticated, return empty context
  if (!userId) {
    return {
      organizationId: null,
      teamId: null,
      userId: null,
      isOrgMember: false,
      isTeamMember: false,
    };
  }

  // Validate org membership if org is set
  let isOrgMember = false;
  if (organizationId) {
    try {
      const memberships = await tenancyMembershipService.listOrgMembers(organizationId);
      isOrgMember = memberships.some((m) => m.userId === userId);
    } catch {
      isOrgMember = false;
    }
  }

  // Validate team membership if team is set
  let isTeamMember = false;
  if (teamId) {
    try {
      const memberships = await tenancyMembershipService.listTeamMembers(teamId);
      isTeamMember = memberships.some((m) => m.userId === userId);
    } catch {
      isTeamMember = false;
    }
  }

  return {
    organizationId,
    teamId,
    userId,
    isOrgMember,
    isTeamMember,
  };
}

/**
 * Get tenant context for team operations (validates team membership)
 * 
 * @throws Error if user is not a member of the team
 */
export async function getTenantTeamContext(): Promise<TenantContext> {
  const context = await getTenantOrgContext();
  
  if (context.teamId && !context.isTeamMember) {
    throw new Error("User is not a member of this team");
  }
  
  return context;
}

/**
 * Assert that user has access to the current tenant org
 * 
 * @throws Error if user is not authenticated or not a member
 */
export async function assertTenantOrgAccess(): Promise<TenantContext> {
  const context = await getTenantOrgContext();
  
  if (!context.userId) {
    throw new Error("Authentication required");
  }
  
  if (context.organizationId && !context.isOrgMember) {
    throw new Error("Access denied: not a member of this organization");
  }
  
  return context;
}

/**
 * Higher-order function to automatically scope queries by organization
 * 
 * @param baseWhere - Optional base WHERE clause to combine with tenant filter
 * @param orgIdColumn - The column name for organizationId (default: "organizationId")
 * @returns SQL condition that filters by current tenant org
 * 
 * @example
 * ```ts
 * const context = await getTenantOrgContext();
 * const tasks = await db.select().from(tasks)
 *   .where(withTenantOrgScope(eq(tasks.status, 'active')));
 * ```
 */
export async function withTenantOrgScope<T extends Record<string, unknown>>(
  table: T,
  baseWhere?: SQL<unknown>
): Promise<SQL<unknown>> {
  const context = await getTenantOrgContext();
  
  if (!context.organizationId) {
    // No org context - return base where or TRUE
    return baseWhere ?? sql`TRUE`;
  }

  // Type assertion to access organizationId column
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle tables are structurally typed; dynamic column access requires assertion
  const orgIdColumn = (table as any).organizationId;
  
  if (!orgIdColumn) {
    tenancyLogger.warn("Table does not have organizationId column for tenant scoping");
    return baseWhere ?? sql`TRUE`;
  }

  const orgFilter = eq(orgIdColumn, context.organizationId);
  
  return baseWhere ? and(baseWhere, orgFilter)! : orgFilter;
}

/**
 * Higher-order function to scope queries by team
 * 
 * @param baseWhere - Optional base WHERE clause
 * @param teamIdColumn - The column name for teamId (default: "teamId")
 * @returns SQL condition that filters by current tenant team
 */
export async function withTenantTeamScope<T extends Record<string, unknown>>(
  table: T,
  baseWhere?: SQL<unknown>
): Promise<SQL<unknown>> {
  const context = await getTenantTeamContext();
  
  if (!context.teamId) {
    return baseWhere ?? sql`TRUE`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle tables are structurally typed; dynamic column access requires assertion
  const teamIdColumn = (table as any).teamId;
  
  if (!teamIdColumn) {
    tenancyLogger.warn("Table does not have teamId column for tenant scoping");
    return baseWhere ?? sql`TRUE`;
  }

  const teamFilter = eq(teamIdColumn, context.teamId);
  
  return baseWhere ? and(baseWhere, teamFilter)! : teamFilter;
}

/**
 * Get the user's active organization ID from their memberships
 * Falls back to first org membership if no active context is set
 * 
 * @param userId - User ID to get org for
 * @param dbx - Optional database instance
 * @returns Organization ID or null
 */
export async function getActiveOrgForUser(
  userId: string,
  dbx: Database = db
): Promise<string | null> {
  // First check if there's an active org in headers
  const headersList = await headers();
  const activeOrgId = headersList.get(TENANT_HEADERS.ORG_ID);
  
  if (activeOrgId) {
    // Validate user is actually a member
    try {
      const memberships = await tenancyMembershipService.listOrgMembers(activeOrgId, dbx);
      const isMember = memberships.some((m) => m.userId === userId);
      if (isMember) return activeOrgId;
    } catch {
      // Fall through to get first membership
    }
  }

  // Fallback: Get first org membership
  const memberships = await tenancyMembershipService.listForUser(
    userId,
    { page: 1, limit: 1 },
    dbx
  );
  
  const firstOrgMembership = memberships.items.find((m) => m.organizationId);
  return firstOrgMembership?.organizationId ?? null;
}

/**
 * Get the user's active team ID
 * Falls back to first team membership if no active context is set
 * 
 * @param userId - User ID to get team for
 * @param dbx - Optional database instance
 * @returns Team ID or null
 */
export async function getActiveTeamForUser(
  userId: string,
  dbx: Database = db
): Promise<string | null> {
  const headersList = await headers();
  const activeTeamId = headersList.get(TENANT_HEADERS.TEAM_ID);
  
  if (activeTeamId) {
    try {
      const memberships = await tenancyMembershipService.listTeamMembers(activeTeamId, dbx);
      const isMember = memberships.some((m) => m.userId === userId);
      if (isMember) return activeTeamId;
    } catch {
      // Fall through
    }
  }

  // Fallback: Get first team membership
  const memberships = await tenancyMembershipService.listForUser(
    userId,
    { page: 1, limit: 1 },
    dbx
  );
  
  const firstTeamMembership = memberships.items.find((m) => m.teamId);
  return firstTeamMembership?.teamId ?? null;
}
