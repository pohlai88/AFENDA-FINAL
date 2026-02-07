/**
 * @domain magicdrive
 * @layer server
 * @responsibility Exact and near-duplicate detection; create/update duplicate groups
 */

import "server-only"

import { and, eq, ne, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { DUP_REASON } from "@afenda/shared/constants/magicdrive"
import type { Database } from "@afenda/shared/db"
import {
  magicdriveDuplicateGroupVersions,
  magicdriveDuplicateGroups,
  magicdriveObjectIndex,
  magicdriveObjects,
  magicdriveObjectVersions,
} from "@afenda/shared/db"

/**
 * Find other versions in the same tenant with the same sha256.
 * If any exist, create or update a duplicate group and link this version + others.
 * Returns the duplicate group id if one was created/updated.
 */
export async function runExactDuplicateCheck(
  db: Database,
  tenantId: string,
  versionId: string,
  sha256: string
): Promise<string | null> {
  // All versions with this (tenantId, sha256) — we need to join via object to get tenantId
  const versionsWithSameHash = await db
    .select({
      id: magicdriveObjectVersions.id,
      objectId: magicdriveObjectVersions.objectId,
    })
    .from(magicdriveObjectVersions)
    .innerJoin(
      magicdriveObjects,
      eq(magicdriveObjectVersions.objectId, magicdriveObjects.id)
    )
    .where(
      and(
        eq(magicdriveObjects.tenantId, tenantId),
        eq(magicdriveObjectVersions.sha256, sha256)
      )
    )

  if (versionsWithSameHash.length <= 1) {
    return null
  }

  const versionIds = versionsWithSameHash.map((v: { id: string }) => v.id)
  if (!versionIds.includes(versionId)) {
    versionIds.push(versionId)
  }

  // Check if there's already a group containing any of these versions
  const existing = await db
    .select({ groupId: magicdriveDuplicateGroupVersions.groupId })
    .from(magicdriveDuplicateGroupVersions)
    .where(
      sql`${magicdriveDuplicateGroupVersions.versionId} IN (${sql.join(
        versionIds.map((id: string) => sql`${id}`),
        sql`, `
      )})`
    )
    .limit(1)

  if (existing.length > 0) {
    const groupId = existing[0]!.groupId
    // Add this version to the group if not already
    for (const vid of versionIds) {
      await db
        .insert(magicdriveDuplicateGroupVersions)
        .values({ groupId, versionId: vid })
        .onConflictDoNothing()
    }
    return groupId
  }

  const groupId = randomUUID()
  await db.insert(magicdriveDuplicateGroups).values({
    id: groupId,
    tenantId,
    reason: DUP_REASON.EXACT,
  })
  for (const vid of versionIds) {
    await db.insert(magicdriveDuplicateGroupVersions).values({ groupId, versionId: vid })
  }
  return groupId
}

/**
 * Find other objects in the same tenant with the same textHash (from object_index).
 * If any exist, create or update a duplicate group (reason=near) and link this version + others' current versions.
 * Returns the duplicate group id if one was created/updated.
 * Call after OCR has upserted object_index with textHash.
 */
export async function runNearDuplicateCheck(
  db: Database,
  tenantId: string,
  objectId: string,
  versionId: string,
  textHash: string
): Promise<string | null> {
  if (!textHash || textHash.length === 0) {
    return null
  }

  // All object_index rows in same tenant with same textHash, excluding current object
  const others = await db
    .select({
      objectId: magicdriveObjectIndex.objectId,
      currentVersionId: magicdriveObjects.currentVersionId,
    })
    .from(magicdriveObjectIndex)
    .innerJoin(
      magicdriveObjects,
      eq(magicdriveObjectIndex.objectId, magicdriveObjects.id)
    )
    .where(
      and(
        eq(magicdriveObjects.tenantId, tenantId),
        eq(magicdriveObjectIndex.textHash, textHash),
        ne(magicdriveObjectIndex.objectId, objectId)
      )
    )

  const versionIds: string[] = [versionId]
  for (const row of others) {
    if (row.currentVersionId && !versionIds.includes(row.currentVersionId)) {
      versionIds.push(row.currentVersionId)
    }
  }

  if (versionIds.length <= 1) {
    return null
  }

  // Check if there's already a group containing any of these versions (reason=near)
  const existing = await db
    .select({ groupId: magicdriveDuplicateGroupVersions.groupId })
    .from(magicdriveDuplicateGroupVersions)
    .innerJoin(
      magicdriveDuplicateGroups,
      eq(magicdriveDuplicateGroupVersions.groupId, magicdriveDuplicateGroups.id)
    )
    .where(
      and(
        eq(magicdriveDuplicateGroups.tenantId, tenantId),
        eq(magicdriveDuplicateGroups.reason, DUP_REASON.NEAR),
        sql`${magicdriveDuplicateGroupVersions.versionId} IN (${sql.join(
          versionIds.map((id: string) => sql`${id}`),
          sql`, `
        )})`
      )
    )
    .limit(1)

  if (existing.length > 0) {
    const groupId = existing[0]!.groupId
    for (const vid of versionIds) {
      await db
        .insert(magicdriveDuplicateGroupVersions)
        .values({ groupId, versionId: vid })
        .onConflictDoNothing()
    }
    return groupId
  }

  const groupId = randomUUID()
  await db.insert(magicdriveDuplicateGroups).values({
    id: groupId,
    tenantId,
    reason: DUP_REASON.NEAR,
  })
  for (const vid of versionIds) {
    await db.insert(magicdriveDuplicateGroupVersions).values({ groupId, versionId: vid })
  }
  return groupId
}
