/**
 * @layer domain (magicdrive)
 * @responsibility Duplicate detection server actions.
 * Phase 4: Enhanced with tenant context for org/team-scoped duplicate management.
 *
 * Wires to lib/server/magicdrive/duplicates.ts and keep-best.ts
 */

"use server"

import { revalidatePath } from "next/cache"
import { logError } from "../pino"
import { eq, sql } from "drizzle-orm"

import { routes } from "@afenda/shared/constants"
import {
  getDb,
  magicdriveDuplicateGroups,
  magicdriveDuplicateGroupVersions,
  magicdriveObjects,
  magicdriveObjectVersions,
} from "@afenda/magicdrive/server/db"
import { setKeepBest } from "../lib/keep-best"
import { getAuthContext } from "@afenda/auth/server"

/** Tenant context for duplicate operations */
interface TenantContext {
  tenantId?: string | null
  teamId?: string | null
}

export interface DuplicateGroup {
  id: string
  reason: "exact" | "near"
  keepVersionId: string | null
  documentCount: number
  documents: {
    id: string
    title: string | null
    versionId: string
    sha256: string | null
    sizeBytes: number
    createdAt: string
  }[]
  createdAt: string
}

/**
 * Server action: List duplicate groups for a workspace.
 * Phase 4: When org/team columns are applied, will also filter by organization_id/team_id.
 */
export async function listDuplicateGroupsAction(
  workspaceId: string,
  tenantContext?: TenantContext
): Promise<DuplicateGroup[]> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return []
    }

    const db = getDb()

    // Get all duplicate groups for this tenant — prefer tenantId, fallback to tenantId
    const tenantFilter = tenantContext?.tenantId
      ? eq(magicdriveDuplicateGroups.tenantId, tenantContext.tenantId)
      : eq(magicdriveDuplicateGroups.tenantId, workspaceId)

    const groups = await db
      .select()
      .from(magicdriveDuplicateGroups)
      .where(tenantFilter)
      .orderBy(sql`${magicdriveDuplicateGroups.createdAt} DESC`)

    const result: DuplicateGroup[] = []

    for (const group of groups) {
      // Get versions in this group
      const groupVersions = await db
        .select({
          versionId: magicdriveDuplicateGroupVersions.versionId,
        })
        .from(magicdriveDuplicateGroupVersions)
        .where(eq(magicdriveDuplicateGroupVersions.groupId, group.id))

      const versionIds = groupVersions.map((v) => v.versionId)
      if (versionIds.length === 0) continue

      // Get version + object details
      const documents: DuplicateGroup["documents"] = []
      for (const versionId of versionIds) {
        const [version] = await db
          .select({
            id: magicdriveObjectVersions.id,
            objectId: magicdriveObjectVersions.objectId,
            sha256: magicdriveObjectVersions.sha256,
            sizeBytes: magicdriveObjectVersions.sizeBytes,
            createdAt: magicdriveObjectVersions.createdAt,
          })
          .from(magicdriveObjectVersions)
          .where(eq(magicdriveObjectVersions.id, versionId))
          .limit(1)

        if (!version) continue

        const [obj] = await db
          .select({ title: magicdriveObjects.title })
          .from(magicdriveObjects)
          .where(eq(magicdriveObjects.id, version.objectId))
          .limit(1)

        documents.push({
          id: version.objectId,
          title: obj?.title || null,
          versionId: version.id,
          sha256: version.sha256,
          sizeBytes: version.sizeBytes,
          createdAt: version.createdAt?.toISOString() ?? "",
        })
      }

      result.push({
        id: group.id,
        reason: group.reason as "exact" | "near",
        keepVersionId: group.keepVersionId ?? null,
        documentCount: documents.length,
        documents,
        createdAt: group.createdAt?.toISOString() ?? "",
      })
    }

    return result
  } catch (error) {
    logError(error, { operation: "listDuplicateGroupsAction" })
    return []
  }
}

/**
 * Server action: Get single duplicate group with documents.
 */
export async function getDuplicateGroupAction(
  groupId: string
): Promise<DuplicateGroup | null> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return null
    }

    const db = getDb()

    const [group] = await db
      .select()
      .from(magicdriveDuplicateGroups)
      .where(eq(magicdriveDuplicateGroups.id, groupId))
      .limit(1)

    if (!group) return null

    // Get versions in this group
    const groupVersions = await db
      .select({
        versionId: magicdriveDuplicateGroupVersions.versionId,
      })
      .from(magicdriveDuplicateGroupVersions)
      .where(eq(magicdriveDuplicateGroupVersions.groupId, groupId))

    const documents: DuplicateGroup["documents"] = []
    for (const { versionId } of groupVersions) {
      const [version] = await db
        .select({
          id: magicdriveObjectVersions.id,
          objectId: magicdriveObjectVersions.objectId,
          sha256: magicdriveObjectVersions.sha256,
          sizeBytes: magicdriveObjectVersions.sizeBytes,
          createdAt: magicdriveObjectVersions.createdAt,
        })
        .from(magicdriveObjectVersions)
        .where(eq(magicdriveObjectVersions.id, versionId))
        .limit(1)

      if (!version) continue

      const [obj] = await db
        .select({ title: magicdriveObjects.title })
        .from(magicdriveObjects)
        .where(eq(magicdriveObjects.id, version.objectId))
        .limit(1)

      documents.push({
        id: version.objectId,
        title: obj?.title || null,
        versionId: version.id,
        sha256: version.sha256,
        sizeBytes: version.sizeBytes,
        createdAt: version.createdAt?.toISOString() ?? "",
      })
    }

    return {
      id: group.id,
      reason: group.reason as "exact" | "near",
      keepVersionId: group.keepVersionId ?? null,
      documentCount: documents.length,
      documents,
      createdAt: group.createdAt?.toISOString() ?? "",
    }
  } catch (error) {
    logError(error, { operation: "getDuplicateGroupAction" })
    return null
  }
}

/**
 * Server action: Keep one version and archive/delete duplicates.
 */
export async function resolveDuplicatesAction(params: {
  groupId: string
  keepVersionId: string
  action: "archive" | "delete"
}): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    // Get the group to verify tenant
    const [group] = await db
      .select()
      .from(magicdriveDuplicateGroups)
      .where(eq(magicdriveDuplicateGroups.id, params.groupId))
      .limit(1)

    if (!group) {
      return { success: false, error: "Duplicate group not found" }
    }

    // Set the keep version
    const result = await setKeepBest(
      params.groupId,
      params.keepVersionId,
      group.tenantId,
      auth.userId
    )

    if (!result.ok) {
      return { success: false, error: result.error }
    }

    // Archive or delete the other documents
    const groupVersions = await db
      .select({ versionId: magicdriveDuplicateGroupVersions.versionId })
      .from(magicdriveDuplicateGroupVersions)
      .where(eq(magicdriveDuplicateGroupVersions.groupId, params.groupId))

    for (const { versionId } of groupVersions) {
      if (versionId === params.keepVersionId) continue

      const [version] = await db
        .select({ objectId: magicdriveObjectVersions.objectId })
        .from(magicdriveObjectVersions)
        .where(eq(magicdriveObjectVersions.id, versionId))
        .limit(1)

      if (!version) continue

      if (params.action === "archive") {
        await db
          .update(magicdriveObjects)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(magicdriveObjects.id, version.objectId))
      } else if (params.action === "delete") {
        await db
          .update(magicdriveObjects)
          .set({ deletedAt: new Date(), updatedAt: new Date() })
          .where(eq(magicdriveObjects.id, version.objectId))
      }
    }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { operation: "resolveDuplicatesAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Ignore duplicate group (mark as resolved without action).
 */
export async function ignoreDuplicateGroupAction(
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    // Delete the group (effectively "ignoring" it)
    // The versions remain but are no longer grouped as duplicates
    await db
      .delete(magicdriveDuplicateGroupVersions)
      .where(eq(magicdriveDuplicateGroupVersions.groupId, groupId))

    await db
      .delete(magicdriveDuplicateGroups)
      .where(eq(magicdriveDuplicateGroups.id, groupId))

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { operation: "ignoreDuplicateGroupAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Merge duplicate documents into one.
 */
export async function mergeDuplicatesAction(params: {
  groupId: string
  keepVersionId: string
  mergeMetadata: boolean
  mergeTags: boolean
}): Promise<{ success: boolean; mergedObjectId?: string; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    // Get the group
    const [group] = await db
      .select()
      .from(magicdriveDuplicateGroups)
      .where(eq(magicdriveDuplicateGroups.id, params.groupId))
      .limit(1)

    if (!group) {
      return { success: false, error: "Duplicate group not found" }
    }

    // Set the keep version
    const result = await setKeepBest(
      params.groupId,
      params.keepVersionId,
      group.tenantId,
      auth.userId
    )

    if (!result.ok) {
      return { success: false, error: result.error }
    }

    // Get the kept object
    const [keptVersion] = await db
      .select({ objectId: magicdriveObjectVersions.objectId })
      .from(magicdriveObjectVersions)
      .where(eq(magicdriveObjectVersions.id, params.keepVersionId))
      .limit(1)

    if (!keptVersion) {
      return { success: false, error: "Kept version not found" }
    }

    // Merge tags if requested
    if (params.mergeTags) {
      const { magicdriveObjectTags } = await import("@afenda/magicdrive/server/db")

      const groupVersions = await db
        .select({ versionId: magicdriveDuplicateGroupVersions.versionId })
        .from(magicdriveDuplicateGroupVersions)
        .where(eq(magicdriveDuplicateGroupVersions.groupId, params.groupId))

      for (const { versionId } of groupVersions) {
        if (versionId === params.keepVersionId) continue

        const [version] = await db
          .select({ objectId: magicdriveObjectVersions.objectId })
          .from(magicdriveObjectVersions)
          .where(eq(magicdriveObjectVersions.id, versionId))
          .limit(1)

        if (!version) continue

        // Get tags from other object
        const otherTags = await db
          .select({ tagId: magicdriveObjectTags.tagId })
          .from(magicdriveObjectTags)
          .where(eq(magicdriveObjectTags.objectId, version.objectId))

        // Add to kept object
        for (const { tagId } of otherTags) {
          await db
            .insert(magicdriveObjectTags)
            .values({ objectId: keptVersion.objectId, tagId })
            .onConflictDoNothing()
        }
      }
    }

    // Archive the other documents
    const groupVersions = await db
      .select({ versionId: magicdriveDuplicateGroupVersions.versionId })
      .from(magicdriveDuplicateGroupVersions)
      .where(eq(magicdriveDuplicateGroupVersions.groupId, params.groupId))

    for (const { versionId } of groupVersions) {
      if (versionId === params.keepVersionId) continue

      const [version] = await db
        .select({ objectId: magicdriveObjectVersions.objectId })
        .from(magicdriveObjectVersions)
        .where(eq(magicdriveObjectVersions.id, versionId))
        .limit(1)

      if (!version) continue

      await db
        .update(magicdriveObjects)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(magicdriveObjects.id, version.objectId))
    }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true, mergedObjectId: keptVersion.objectId }
  } catch (error) {
    logError(error, { operation: "mergeDuplicatesAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Get duplicate count for a workspace (for badges/notifications).
 * Phase 4: When org/team columns are applied, will also filter by organization_id/team_id.
 */
export async function getDuplicateCountAction(
  workspaceId: string,
  _tenantContext?: TenantContext
): Promise<number> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return 0
    }

    const db = getDb()

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(magicdriveDuplicateGroups)
      .where(eq(magicdriveDuplicateGroups.tenantId, workspaceId))

    return result[0]?.count || 0
  } catch (error) {
    logError(error, { operation: "getDuplicateCountAction" })
    return 0
  }
}


