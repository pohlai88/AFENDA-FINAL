import { foreignKey, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { idx, uidx } from "./_drizzle.core.index";
import { pkUuid, tenantCols, timeCols, actorCols, traceCols, metaCols } from "./_drizzle.core.table";
import { authenticatedRole, adminRole } from "./drizzle.roles.neon";
import { crudPolicy, authUid } from "drizzle-orm/neon";
import { pgPolicy } from "drizzle-orm/pg-core";

/**
 * TEMPLATE: demonstrates FK + Index + RLS policy declared in schema.
 *
 * Replace with real tables later; keep the *pattern*.
 */

export const templateParents = pgTable("template_parents", {
  id: pkUuid(),
  ...tenantCols(),
  title: text("title").notNull(),
  ...traceCols(),
  ...actorCols(),
  ...timeCols(),
});

export const templateChildren = pgTable(
  "template_children",
  {
    id: pkUuid(),
    ...tenantCols(),

    parentId: text("parent_id").notNull(),
    userId: text("user_id").notNull(),

    startAt: timestamp("start_at", { withTimezone: true, mode: "date" }),
    endAt: timestamp("end_at", { withTimezone: true, mode: "date" }),

    ...metaCols(),
    ...traceCols(),
    ...actorCols(),
    ...timeCols(),
  },
  (t) => [
    // FK (explicit name for deterministic migrations)
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [templateParents.id],
      name: "template_children_parent_id_fk",
    }).onDelete("cascade"),

    // Indexes
    idx("template_children_tenant_parent_idx").on(t.tenantId, t.parentId),
    uidx("template_children_tenant_id_id_uidx").on(t.tenantId, t.id),

    // Neon helper: admin can read but not modify
    crudPolicy({ role: adminRole, read: true, modify: false }),

    // Example: authenticated users can only see/modify their own rows by userId match
    pgPolicy("template_children_user_owns_row", {
      for: "all",
      to: authenticatedRole,
      using: authUid(t.userId),
      withCheck: authUid(t.userId),
    }),

    // Example tenant policy via session variable (server must set app.tenant_id)
    pgPolicy("template_children_tenant_is_current", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.tenantId} = current_setting('app.tenant_id', true)`,
      withCheck: sql`${t.tenantId} = current_setting('app.tenant_id', true)`,
    }),
  ]
);
