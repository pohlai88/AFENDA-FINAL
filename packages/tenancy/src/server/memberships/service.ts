/**
 * @domain tenancy
 * @layer server
 * @responsibility Membership CRUD (org and standalone team)
 */

import "server-only";

import { eq, and, or, sql, desc } from "drizzle-orm";
import {
  tenancyMemberships,
  tenancyOrganizations,
  tenancyTeams,
} from "@afenda/tenancy/drizzle";
import type { TenancyMembershipQuery } from "@afenda/tenancy/zod";
import { db } from "@afenda/shared/server/db";
import type { Database } from "@afenda/shared/server/db";
import { randomUUID } from "crypto";

export const tenancyMembershipService = {
  async createTeamMembership(
    teamId: string,
    userId: string,
    role: "lead" | "member",
    dbx: Database = db
  ) {
    const id = randomUUID();
    const [row] = await dbx
      .insert(tenancyMemberships)
      .values({
        id,
        userId,
        organizationId: null,
        teamId,
        role,
      })
      .returning();
    if (!row) throw new Error("Failed to add team membership");
    return row;
  },

  async listForUser(
    userId: string,
    query: TenancyMembershipQuery,
    dbx: Database = db
  ) {
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    const baseConditions = [
      eq(tenancyMemberships.userId, userId),
      eq(tenancyMemberships.isActive, true),
      or(
        sql`${tenancyMemberships.organizationId} IS NOT NULL`,
        sql`${tenancyMemberships.teamId} IS NOT NULL`
      )!,
    ];

    const whereClause = and(...baseConditions);

    const [countResult] = await dbx
      .select({ count: sql<number>`count(*)` })
      .from(tenancyMemberships)
      .where(whereClause);

    const rows = await dbx
      .select({
        id: tenancyMemberships.id,
        userId: tenancyMemberships.userId,
        organizationId: tenancyMemberships.organizationId,
        teamId: tenancyMemberships.teamId,
        role: tenancyMemberships.role,
        permissions: tenancyMemberships.permissions,
        invitedBy: tenancyMemberships.invitedBy,
        joinedAt: tenancyMemberships.joinedAt,
        isActive: tenancyMemberships.isActive,
        orgName: tenancyOrganizations.name,
        teamName: tenancyTeams.name,
      })
      .from(tenancyMemberships)
      .leftJoin(
        tenancyOrganizations,
        eq(tenancyMemberships.organizationId, tenancyOrganizations.id)
      )
      .leftJoin(tenancyTeams, eq(tenancyMemberships.teamId, tenancyTeams.id))
      .where(whereClause)
      .orderBy(desc(tenancyMemberships.joinedAt))
      .limit(limit)
      .offset(offset);

    return {
      items: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        organizationId: r.organizationId,
        teamId: r.teamId,
        role: r.role,
        permissions: r.permissions ?? {},
        invitedBy: r.invitedBy,
        joinedAt: r.joinedAt?.toISOString() ?? "",
        isActive: r.isActive,
        orgName: r.orgName ?? null,
        teamName: r.teamName ?? null,
      })),
      total: Number(countResult?.count ?? 0),
    };
  },

  async listTeamMembers(teamId: string, dbx: Database = db) {
    const rows = await dbx
      .select({
        id: tenancyMemberships.id,
        userId: tenancyMemberships.userId,
        role: tenancyMemberships.role,
        joinedAt: tenancyMemberships.joinedAt,
      })
      .from(tenancyMemberships)
      .where(
        and(
          eq(tenancyMemberships.teamId, teamId),
          eq(tenancyMemberships.isActive, true)
        )
      )
      .orderBy(tenancyMemberships.joinedAt);

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      role: r.role,
      joinedAt: r.joinedAt?.toISOString() ?? "",
    }));
  },

  async listOrgMembers(orgId: string, dbx: Database = db) {
    const rows = await dbx
      .select({
        id: tenancyMemberships.id,
        userId: tenancyMemberships.userId,
        role: tenancyMemberships.role,
        permissions: tenancyMemberships.permissions,
        invitedBy: tenancyMemberships.invitedBy,
        joinedAt: tenancyMemberships.joinedAt,
      })
      .from(tenancyMemberships)
      .where(
        and(
          eq(tenancyMemberships.organizationId, orgId),
          eq(tenancyMemberships.isActive, true)
        )
      )
      .orderBy(desc(tenancyMemberships.joinedAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      role: r.role,
      permissions: r.permissions ?? {},
      invitedBy: r.invitedBy,
      joinedAt: r.joinedAt?.toISOString() ?? "",
    }));
  },

  async updateMembership(
    id: string,
    updates: { role?: string; permissions?: Record<string, boolean> },
    dbx: Database = db
  ) {
    const [row] = await dbx
      .update(tenancyMemberships)
      .set({
        ...updates,
        updatedAt: sql`now()`,
      })
      .where(eq(tenancyMemberships.id, id))
      .returning();
    
    if (!row) throw new Error("Membership not found");
    return row;
  },

  async deleteMembership(id: string, dbx: Database = db) {
    // Soft delete by setting isActive to false
    const [row] = await dbx
      .update(tenancyMemberships)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(eq(tenancyMemberships.id, id))
      .returning();
    
    if (!row) throw new Error("Membership not found");
    return row;
  },

  async addOrgMember(
    orgId: string,
    userId: string,
    role: "owner" | "admin" | "member",
    invitedBy: string,
    dbx: Database = db
  ) {
    const id = randomUUID();
    const [row] = await dbx
      .insert(tenancyMemberships)
      .values({
        id,
        userId,
        organizationId: orgId,
        teamId: null,
        role,
        invitedBy,
      })
      .returning();
    
    if (!row) throw new Error("Failed to add organization member");
    return row;
  },

  async getMembership(id: string, dbx: Database = db) {
    const [row] = await dbx
      .select()
      .from(tenancyMemberships)
      .where(eq(tenancyMemberships.id, id));
    
    return row ?? null;
  },

  async countOrgOwners(orgId: string, dbx: Database = db) {
    const [result] = await dbx
      .select({ count: sql<number>`count(*)` })
      .from(tenancyMemberships)
      .where(
        and(
          eq(tenancyMemberships.organizationId, orgId),
          eq(tenancyMemberships.role, "owner"),
          eq(tenancyMemberships.isActive, true)
        )
      );
    
    return Number(result?.count ?? 0);
  },
};
