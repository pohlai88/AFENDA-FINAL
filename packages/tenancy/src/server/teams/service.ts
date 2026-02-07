/**
 * @domain tenancy
 * @layer server
 * @responsibility Team CRUD
 */

import "server-only";

import { eq, and, or, ilike, isNull, sql, desc } from "drizzle-orm";
import {
  tenancyTeams,
  tenancyOrganizations,
  tenancyMemberships,
} from "@afenda/tenancy/drizzle";
import type {
  TenancyCreateTeam,
  TenancyUpdateTeam,
  TenancyTeamQuery,
} from "@afenda/tenancy/zod";
import { db } from "@afenda/shared/server/db";
import type { Database } from "@afenda/shared/server/db";
import { randomUUID } from "crypto";

export const tenancyTeamService = {
  async create(input: TenancyCreateTeam, dbx: Database = db) {
    const id = randomUUID();
    const [row] = await dbx
      .insert(tenancyTeams)
      .values({
        id,
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        parentId: input.parentId ?? null,
      })
      .returning();
    if (!row) throw new Error("Failed to create team");
    return row;
  },

  async list(
    query: TenancyTeamQuery,
    userId: string,
    dbx: Database = db
  ) {
    const { page, limit, search, organizationId } = query;
    const offset = (page - 1) * limit;

    // User has access via org membership (org-scoped teams) OR direct team membership (standalone)
    const baseConditions = [
      or(
        and(
          sql`${tenancyTeams.organizationId} IS NOT NULL`,
          sql`EXISTS (
            SELECT 1 FROM ${tenancyMemberships} m
            WHERE m.organization_id = ${tenancyTeams.organizationId}
            AND m.user_id = ${userId}
            AND m.is_active = true
          )`
        ),
        and(
          sql`${tenancyTeams.organizationId} IS NULL`,
          sql`EXISTS (
            SELECT 1 FROM ${tenancyMemberships} m
            WHERE m.team_id = ${tenancyTeams.id}
            AND m.user_id = ${userId}
            AND m.is_active = true
            AND m.organization_id IS NULL
          )`
        )
      )!,
    ];
    if (organizationId !== undefined && organizationId !== null && organizationId !== "") {
      baseConditions.push(eq(tenancyTeams.organizationId, organizationId));
    } else if (organizationId === "") {
      baseConditions.push(isNull(tenancyTeams.organizationId));
    }
    if (search) {
      baseConditions.push(
        ilike(tenancyTeams.name, `%${search}%`) as ReturnType<typeof ilike>
      );
    }
    const where = and(...baseConditions);

    const [countResult] = await dbx
      .select({ count: sql<number>`count(*)` })
      .from(tenancyTeams)
      .where(where);

    const items = await dbx
      .select({
        id: tenancyTeams.id,
        organizationId: tenancyTeams.organizationId,
        name: tenancyTeams.name,
        slug: tenancyTeams.slug,
        description: tenancyTeams.description,
        parentId: tenancyTeams.parentId,
        settings: tenancyTeams.settings,
        isActive: tenancyTeams.isActive,
        createdAt: tenancyTeams.createdAt,
        updatedAt: tenancyTeams.updatedAt,
        orgName: tenancyOrganizations.name,
      })
      .from(tenancyTeams)
      .leftJoin(
        tenancyOrganizations,
        eq(tenancyTeams.organizationId, tenancyOrganizations.id)
      )
      .where(where)
      .orderBy(desc(tenancyTeams.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items: items.map((r) => ({
        ...r,
        createdAt: r.createdAt?.toISOString() ?? "",
        updatedAt: r.updatedAt?.toISOString() ?? "",
      })),
      total: Number(countResult?.count ?? 0),
    };
  },

  async getById(id: string, dbx: Database = db) {
    const [row] = await dbx
      .select()
      .from(tenancyTeams)
      .where(eq(tenancyTeams.id, id));
    return row ?? null;
  },

  async update(id: string, input: TenancyUpdateTeam, dbx: Database = db) {
    const [row] = await dbx
      .update(tenancyTeams)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(tenancyTeams.id, id))
      .returning();
    return row ?? null;
  },

  async delete(id: string, dbx: Database = db) {
    const [row] = await dbx
      .delete(tenancyTeams)
      .where(eq(tenancyTeams.id, id))
      .returning({ id: tenancyTeams.id });
    return row ?? null;
  },

  async addMember(
    teamId: string,
    userId: string,
    role: "lead" | "member",
    dbx: Database = db
  ) {
    const membershipId = randomUUID();
    const [row] = await dbx
      .insert(tenancyMemberships)
      .values({
        id: membershipId,
        userId,
        organizationId: null,
        teamId,
        role,
      })
      .returning();
    if (!row) throw new Error("Failed to add team member");
    return row;
  },

  async getMemberCount(teamId: string, dbx: Database = db) {
    const [r] = await dbx
      .select({ count: sql<number>`count(*)` })
      .from(tenancyMemberships)
      .where(
        and(
          eq(tenancyMemberships.teamId, teamId),
          eq(tenancyMemberships.isActive, true)
        )
      );
    return Number(r?.count ?? 0);
  },
};
