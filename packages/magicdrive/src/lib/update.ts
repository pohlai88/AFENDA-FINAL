/**
 * @domain magicdrive
 * @layer server
 * @responsibility Update object status (approve, archive); bulk actions
 */

import "server-only"

import { and, eq, inArray } from "drizzle-orm"

import { STATUS } from "@afenda/shared/constants/magicdrive"
import { getDb, magicdriveObjects } from "@afenda/shared/db"
import { addTagToObject } from "./tags"

export type UpdateStatusResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateObjectStatus(
  tenantId: string,
  objectId: string,
  status: string
): Promise<UpdateStatusResult> {
  const db = getDb()
  const [row] = await db
    .select({ id: magicdriveObjects.id })
    .from(magicdriveObjects)
    .where(
      and(
        eq(magicdriveObjects.id, objectId),
        eq(magicdriveObjects.tenantId, tenantId)
      )
    )
    .limit(1)
  if (!row) return { ok: false, error: "Object not found" }
  if (!Object.values(STATUS).includes(status as (typeof STATUS)[keyof typeof STATUS])) {
    return { ok: false, error: "Invalid status" }
  }
  await db
    .update(magicdriveObjects)
    .set({
      status: status as (typeof magicdriveObjects.$inferSelect)["status"],
      updatedAt: new Date(),
    })
    .where(eq(magicdriveObjects.id, objectId))
  return { ok: true }
}

export type DeleteObjectResult =
  | { ok: true }
  | { ok: false; error: string }

export async function deleteObject(
  tenantId: string,
  objectId: string
): Promise<DeleteObjectResult> {
  const db = getDb()
  const [row] = await db
    .select({ id: magicdriveObjects.id })
    .from(magicdriveObjects)
    .where(
      and(
        eq(magicdriveObjects.id, objectId),
        eq(magicdriveObjects.tenantId, tenantId)
      )
    )
    .limit(1)
  if (!row) return { ok: false, error: "Object not found" }
  await db
    .update(magicdriveObjects)
    .set({
      status: STATUS.DELETED as (typeof magicdriveObjects.$inferSelect)["status"],
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(magicdriveObjects.id, objectId))
  return { ok: true }
}

export type BulkAction = "archive" | "addTag" | "delete" | "activate"
export type BulkActionResult =
  | { ok: true; updated: number }
  | { ok: false; error: string }

export async function runBulkAction(
  tenantId: string,
  objectIds: string[],
  action: BulkAction,
  tagId?: string
): Promise<BulkActionResult> {
  if (objectIds.length === 0) return { ok: true, updated: 0 }
  const db = getDb()

  if (action === "archive") {
    await db
      .update(magicdriveObjects)
      .set({
      status: STATUS.ARCHIVED as (typeof magicdriveObjects.$inferSelect)["status"],
      updatedAt: new Date(),
    })
      .where(
        and(
          inArray(magicdriveObjects.id, objectIds),
          eq(magicdriveObjects.tenantId, tenantId)
        )
      )
    return { ok: true, updated: objectIds.length }
  }

  if (action === "delete") {
    await db
      .update(magicdriveObjects)
      .set({
      status: STATUS.DELETED as (typeof magicdriveObjects.$inferSelect)["status"],
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
      .where(
        and(
          inArray(magicdriveObjects.id, objectIds),
          eq(magicdriveObjects.tenantId, tenantId)
        )
      )
    return { ok: true, updated: objectIds.length }
  }

  if (action === "activate") {
    await db
      .update(magicdriveObjects)
      .set({
      status: STATUS.ACTIVE as (typeof magicdriveObjects.$inferSelect)["status"],
      updatedAt: new Date(),
    })
      .where(
        and(
          inArray(magicdriveObjects.id, objectIds),
          eq(magicdriveObjects.tenantId, tenantId)
        )
      )
    return { ok: true, updated: objectIds.length }
  }

  if (action === "addTag") {
    if (!tagId) return { ok: false, error: "tagId required for addTag" }
    let updated = 0
    for (const objectId of objectIds) {
      const r = await addTagToObject(tenantId, objectId, tagId)
      if (r.ok) updated++
    }
    return { ok: true, updated }
  }

  return { ok: false, error: "Unknown action" }
}
