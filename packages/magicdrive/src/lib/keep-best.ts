/**
 * @domain magicdrive
 * @layer server
 * @responsibility Set keepVersionId on duplicate group; optionally archive other versions
 */

import "server-only"

import { and, eq } from "drizzle-orm"

import {
  getDb,
  magicdriveDuplicateGroupVersions,
  magicdriveDuplicateGroups,
  magicdriveObjects,
  magicdriveObjectVersions,
} from "@afenda/shared/db"

export type KeepBestResult =
  | { ok: true; groupId: string }
  | { ok: false; error: string }

/**
 * Set the "keep" version for a duplicate group. Optionally updates each object's
 * currentVersionId to the kept version for the object that owns it, and archives
 * other versions' objects (or leaves them visible for "duplicates" UI).
 */
export async function setKeepBest(
  groupId: string,
  versionId: string,
  tenantId: string,
  _ownerId: string
): Promise<KeepBestResult> {
  const db = getDb()

  const [group] = await db
    .select()
    .from(magicdriveDuplicateGroups)
    .where(eq(magicdriveDuplicateGroups.id, groupId))
    .limit(1)

  if (!group) {
    return { ok: false, error: "Group not found" }
  }
  if (group.tenantId !== tenantId) {
    return { ok: false, error: "Forbidden" }
  }

  const memberVersionIds = await db
    .select({ versionId: magicdriveDuplicateGroupVersions.versionId })
    .from(magicdriveDuplicateGroupVersions)
    .where(eq(magicdriveDuplicateGroupVersions.groupId, groupId))

  const versionIds = memberVersionIds.map((r) => r.versionId)
  if (!versionIds.includes(versionId)) {
    return { ok: false, error: "Version is not in this duplicate group" }
  }

  await db
    .update(magicdriveDuplicateGroups)
    .set({ keepVersionId: versionId })
    .where(eq(magicdriveDuplicateGroups.id, groupId))

  // Optional: set each object's currentVersionId to the kept version when that object owns it
  const [keptVersion] = await db
    .select({ objectId: magicdriveObjectVersions.objectId })
    .from(magicdriveObjectVersions)
    .where(eq(magicdriveObjectVersions.id, versionId))
    .limit(1)

  if (keptVersion) {
    await db
      .update(magicdriveObjects)
      .set({ currentVersionId: versionId, updatedAt: new Date() })
      .where(
        and(
          eq(magicdriveObjects.id, keptVersion.objectId),
          eq(magicdriveObjects.tenantId, tenantId)
        )
      )
  }

  return { ok: true, groupId }
}
