/**
 * @domain tenancy
 * @layer server
 * @responsibility Tenant design system (theming)
 */

import "server-only";

import { eq } from "drizzle-orm";
import { tenancyTenantDesignSystem } from "@afenda/tenancy/drizzle";
import type { TenancyDesignSystemSettings } from "@afenda/tenancy/zod";
import { DEFAULT_DESIGN_SYSTEM } from "@afenda/tenancy/zod";
import { db } from "@afenda/shared/server/db";
import type { Database } from "@afenda/shared/server/db";

export const tenancyDesignSystemService = {
  async get(tenantId: string, dbx: Database = db) {
    const [row] = await dbx
      .select()
      .from(tenancyTenantDesignSystem)
      .where(eq(tenancyTenantDesignSystem.tenantId, tenantId));
    return row ?? null;
  },

  async getOrDefault(tenantId: string, dbx: Database = db) {
    const row = await this.get(tenantId, dbx);
    if (row) {
      return {
        tenantId: row.tenantId,
        settings: { ...DEFAULT_DESIGN_SYSTEM, ...(row.settings ?? {}) },
        createdAt: row.createdAt?.toISOString() ?? "",
        updatedAt: row.updatedAt?.toISOString() ?? "",
      };
    }
    return {
      tenantId,
      settings: DEFAULT_DESIGN_SYSTEM,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async upsert(
    tenantId: string,
    settings: Partial<TenancyDesignSystemSettings>,
    dbx: Database = db
  ) {
    const now = new Date();
    const existing = await this.get(tenantId, dbx);
    const merged = existing
      ? { ...(existing.settings ?? {}), ...settings }
      : { ...DEFAULT_DESIGN_SYSTEM, ...settings };

    const [row] = await dbx
      .insert(tenancyTenantDesignSystem)
      .values({
        tenantId,
        settings: merged,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [tenancyTenantDesignSystem.tenantId],
        set: { settings: merged, updatedAt: now },
      })
      .returning();

    if (!row) throw new Error("Failed to upsert tenant design system");
    return {
      tenantId: row.tenantId,
      settings: row.settings ?? merged,
      createdAt: row.createdAt?.toISOString() ?? "",
      updatedAt: row.updatedAt?.toISOString() ?? "",
    };
  },
};
