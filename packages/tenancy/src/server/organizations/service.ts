/**
 * @domain tenancy
 * @layer server
 * @responsibility Organization CRUD
 */

import "server-only";

import { eq, and, ilike, sql, desc } from "drizzle-orm";
import {
  tenancyOrganizations,
  tenancyTeams,
  tenancyMemberships,
} from "@afenda/tenancy/drizzle";
import type {
  TenancyCreateOrganization,
  TenancyUpdateOrganization,
  TenancyOrganizationQuery,
} from "@afenda/tenancy/zod";
import { db } from "@afenda/shared/server/db";
import type { Database } from "@afenda/shared/server/db";
import { randomUUID } from "crypto";

export const tenancyOrganizationService = {
  async create(
    input: TenancyCreateOrganization,
    createdBy: string,
    dbx: Database = db
  ) {
    const id = randomUUID();
    const membershipId = randomUUID();
    await dbx.transaction(async (tx) => {
      await tx.insert(tenancyOrganizations).values({
        id,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        logo: input.logo ?? null,
        createdBy,
      });
      await tx.insert(tenancyMemberships).values({
        id: membershipId,
        userId: createdBy,
        organizationId: id,
        teamId: null,
        role: "owner",
      });
    });
    const row = await this.getById(id, dbx);
    if (!row) throw new Error("Failed to create organization");
    return row;
  },

  async listForUser(
    userId: string,
    query: TenancyOrganizationQuery,
    dbx: Database = db
  ) {
    const { page, limit, search } = query;
    const offset = (page - 1) * limit;

    const baseConditions = [
      eq(tenancyMemberships.userId, userId),
      eq(tenancyMemberships.isActive, true),
    ];
    const joinCondition = eq(
      tenancyMemberships.organizationId,
      tenancyOrganizations.id
    );
    const whereClause = search
      ? and(
          ...baseConditions,
          ilike(tenancyOrganizations.name, `%${search}%`)
        )
      : and(...baseConditions);

    const [countResult] = await dbx
      .select({ count: sql<number>`count(*)` })
      .from(tenancyOrganizations)
      .innerJoin(tenancyMemberships, joinCondition)
      .where(whereClause);

    const items = await dbx
      .selectDistinct({
        id: tenancyOrganizations.id,
        name: tenancyOrganizations.name,
        slug: tenancyOrganizations.slug,
        description: tenancyOrganizations.description,
        logo: tenancyOrganizations.logo,
        settings: tenancyOrganizations.settings,
        isActive: tenancyOrganizations.isActive,
        createdAt: tenancyOrganizations.createdAt,
        updatedAt: tenancyOrganizations.updatedAt,
      })
      .from(tenancyOrganizations)
      .innerJoin(tenancyMemberships, joinCondition)
      .where(whereClause)
      .orderBy(desc(tenancyOrganizations.createdAt))
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
      .from(tenancyOrganizations)
      .where(eq(tenancyOrganizations.id, id));
    return row ?? null;
  },

  async update(
    id: string,
    input: TenancyUpdateOrganization,
    dbx: Database = db
  ) {
    const [row] = await dbx
      .update(tenancyOrganizations)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(tenancyOrganizations.id, id))
      .returning();
    return row ?? null;
  },

  async delete(id: string, dbx: Database = db) {
    const [row] = await dbx
      .delete(tenancyOrganizations)
      .where(eq(tenancyOrganizations.id, id))
      .returning({ id: tenancyOrganizations.id });
    return row ?? null;
  },

  async getTeamCount(orgId: string, dbx: Database = db) {
    const [r] = await dbx
      .select({ count: sql<number>`count(*)` })
      .from(tenancyTeams)
      .where(eq(tenancyTeams.organizationId, orgId));
    return Number(r?.count ?? 0);
  },

  async getMemberCount(orgId: string, dbx: Database = db) {
    const [r] = await dbx
      .select({ count: sql<number>`count(*)` })
      .from(tenancyMemberships)
      .where(
        and(
          eq(tenancyMemberships.organizationId, orgId),
          eq(tenancyMemberships.isActive, true)
        )
      );
    return Number(r?.count ?? 0);
  },
};
