/**
 * @layer domain (magicdrive)
 * @responsibility Collection (album) management server actions.
 * Phase 4: Enhanced with tenant context for org/team-scoped collection management.
 *
 * Wires to magicdrive_collections and magicdrive_collection_objects tables.
 */

"use server"

import { revalidatePath } from "next/cache"
import { logError } from "../pino"
import { eq, sql, and } from "drizzle-orm"

import { routes } from "@afenda/shared/constants"
import {
  getDb,
  magicdriveCollections,
  magicdriveCollectionObjects,
} from "@afenda/magicdrive/server/db"
import { getAuthContext } from "@afenda/auth/server"

/** Tenant context for collection operations */
interface TenantContext {
  tenantId?: string | null
  teamId?: string | null
}

export interface Collection {
  id: string
  workspaceId: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  documentCount: number
  isSmartCollection: boolean
  smartFilter: unknown | null
  createdAt: string
  updatedAt: string
}

export interface CreateCollectionInput {
  name: string
  description?: string
  color?: string
  icon?: string
  workspaceId: string
  /** Phase 4: Optional tenant association */
  tenantId?: string | null
  teamId?: string | null
}

export interface UpdateCollectionInput {
  name?: string
  description?: string
  color?: string
  icon?: string
}

/**
 * Server action: List all collections for a workspace.
 * Phase 4: When org/team columns applied, will also filter by organization_id/team_id.
 */
export async function listCollectionsAction(
  workspaceId: string,
  tenantContext?: TenantContext
): Promise<Collection[]> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return []
    }

    const db = getDb()

    // Prefer tenantId filter when tenant context available, fallback to tenantId
    const tenantFilter = tenantContext?.tenantId
      ? eq(magicdriveCollections.tenantId, tenantContext.tenantId)
      : eq(magicdriveCollections.tenantId, workspaceId)

    const collections = await db
      .select()
      .from(magicdriveCollections)
      .where(tenantFilter)
      .orderBy(magicdriveCollections.sortOrder, magicdriveCollections.name)

    const result: Collection[] = []

    for (const col of collections) {
      // Get document count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(magicdriveCollectionObjects)
        .where(eq(magicdriveCollectionObjects.collectionId, col.id))

      result.push({
        id: col.id,
        workspaceId: col.tenantId,
        name: col.name,
        description: col.description,
        color: col.color,
        icon: col.icon,
        documentCount: countResult[0]?.count || 0,
        isSmartCollection: col.isSmartCollection ?? false,
        smartFilter: col.smartFilter,
        createdAt: col.createdAt?.toISOString() ?? "",
        updatedAt: col.updatedAt?.toISOString() ?? "",
      })
    }

    return result
  } catch (error) {
    logError(error, { operation: "listCollectionsAction" })
    return []
  }
}

/**
 * Server action: Get single collection by ID.
 */
export async function getCollectionAction(
  id: string
): Promise<Collection | null> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return null
    }

    const db = getDb()

    const [col] = await db
      .select()
      .from(magicdriveCollections)
      .where(eq(magicdriveCollections.id, id))
      .limit(1)

    if (!col) {
      return null
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(magicdriveCollectionObjects)
      .where(eq(magicdriveCollectionObjects.collectionId, id))

    return {
      id: col.id,
      workspaceId: col.tenantId,
      name: col.name,
      description: col.description,
      color: col.color,
      icon: col.icon,
      documentCount: countResult[0]?.count || 0,
      isSmartCollection: col.isSmartCollection ?? false,
      smartFilter: col.smartFilter,
      createdAt: col.createdAt?.toISOString() ?? "",
      updatedAt: col.updatedAt?.toISOString() ?? "",
    }
  } catch (error) {
    logError(error, { operation: "getCollectionAction" })
    return null
  }
}

/**
 * Server action: Create a new collection.
 */
export async function createCollectionAction(
  input: CreateCollectionInput
): Promise<{ success: boolean; collection?: Collection; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    const { randomUUID } = await import("node:crypto")
    const [created] = await db
      .insert(magicdriveCollections)
      .values({
        id: randomUUID(),
        tenantId: input.tenantId ?? input.workspaceId,
        teamId: input.teamId ?? input.workspaceId,
        ownerId: auth.userId,
        name: input.name,
        description: input.description || null,
        color: input.color || null,
        icon: input.icon || null,
      })
      .returning()

    revalidatePath(routes.ui.magicdrive.root())

    return {
      success: true,
      collection: {
        id: created.id,
        workspaceId: created.tenantId,
        name: created.name,
        description: created.description,
        color: created.color,
        icon: created.icon,
        documentCount: 0,
        isSmartCollection: created.isSmartCollection ?? false,
        smartFilter: created.smartFilter,
        createdAt: created.createdAt?.toISOString() ?? "",
        updatedAt: created.updatedAt?.toISOString() ?? "",
      },
    }
  } catch (error) {
    logError(error, { operation: "createCollectionAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Update a collection.
 */
export async function updateCollectionAction(
  id: string,
  input: UpdateCollectionInput
): Promise<{ success: boolean; collection?: Collection; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    const [existing] = await db
      .select()
      .from(magicdriveCollections)
      .where(eq(magicdriveCollections.id, id))
      .limit(1)

    if (!existing) {
      return { success: false, error: "Collection not found" }
    }

    if (existing.ownerId != null && existing.ownerId !== auth.userId) {
      return { success: false, error: "Forbidden" }
    }

    const [_updated] = await db
      .update(magicdriveCollections)
      .set({
        name: input.name ?? existing.name,
        description: input.description !== undefined ? input.description : existing.description,
        color: input.color !== undefined ? input.color : existing.color,
        icon: input.icon !== undefined ? input.icon : existing.icon,
        updatedAt: new Date(),
      })
      .where(eq(magicdriveCollections.id, id))
      .returning()

    revalidatePath(routes.ui.magicdrive.root())

    const collection = await getCollectionAction(id)
    return { success: true, collection: collection || undefined }
  } catch (error) {
    logError(error, { operation: "updateCollectionAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Delete a collection.
 */
export async function deleteCollectionAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    const [existing] = await db
      .select()
      .from(magicdriveCollections)
      .where(eq(magicdriveCollections.id, id))
      .limit(1)

    if (!existing) {
      return { success: false, error: "Collection not found" }
    }

    if (existing.ownerId != null && existing.ownerId !== auth.userId) {
      return { success: false, error: "Forbidden" }
    }

    // Delete collection (cascade will remove collection_objects)
    await db
      .delete(magicdriveCollections)
      .where(eq(magicdriveCollections.id, id))

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { operation: "deleteCollectionAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Add documents to a collection.
 */
export async function addToCollectionAction(
  collectionId: string,
  documentIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    if (documentIds.length === 0) {
      return { success: true }
    }

    const db = getDb()

    // Verify collection exists
    const [collection] = await db
      .select()
      .from(magicdriveCollections)
      .where(eq(magicdriveCollections.id, collectionId))
      .limit(1)

    if (!collection) {
      return { success: false, error: "Collection not found" }
    }

    // Insert documents (ignore conflicts)
    for (const objectId of documentIds) {
      await db
        .insert(magicdriveCollectionObjects)
        .values({ collectionId, objectId })
        .onConflictDoNothing()
    }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { operation: "addToCollectionAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Remove documents from a collection.
 */
export async function removeFromCollectionAction(
  collectionId: string,
  documentIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    if (documentIds.length === 0) {
      return { success: true }
    }

    const db = getDb()

    for (const objectId of documentIds) {
      await db
        .delete(magicdriveCollectionObjects)
        .where(
          and(
            eq(magicdriveCollectionObjects.collectionId, collectionId),
            eq(magicdriveCollectionObjects.objectId, objectId)
          )
        )
    }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { operation: "removeFromCollectionAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Get documents in a collection.
 */
export async function getCollectionDocumentsAction(
  collectionId: string,
  params?: { limit?: number; offset?: number }
): Promise<{ documentIds: string[]; total: number }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { documentIds: [], total: 0 }
    }

    const db = getDb()
    const limit = params?.limit || 50
    const offset = params?.offset || 0

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(magicdriveCollectionObjects)
      .where(eq(magicdriveCollectionObjects.collectionId, collectionId))

    const total = countResult[0]?.count || 0

    // Get document IDs
    const documents = await db
      .select({ objectId: magicdriveCollectionObjects.objectId })
      .from(magicdriveCollectionObjects)
      .where(eq(magicdriveCollectionObjects.collectionId, collectionId))
      .limit(limit)
      .offset(offset)

    return {
      documentIds: documents.map((d) => d.objectId),
      total,
    }
  } catch (error) {
    logError(error, { operation: "getCollectionDocumentsAction" })
    return { documentIds: [], total: 0 }
  }
}

/**
 * Server action: Create a smart collection with auto-filter.
 */
export async function createSmartCollectionAction(params: {
  name: string
  workspaceId: string
  filter: unknown
  description?: string
  color?: string
}): Promise<{ success: boolean; collection?: Collection; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    const { randomUUID } = await import("node:crypto")
    const [created] = await db
      .insert(magicdriveCollections)
      .values({
        id: randomUUID(),
        tenantId: params.workspaceId,
        teamId: params.workspaceId,
        ownerId: auth.userId,
        name: params.name,
        description: params.description || null,
        color: params.color || null,
        isSmartCollection: true,
        smartFilter: params.filter,
      })
      .returning()

    revalidatePath(routes.ui.magicdrive.root())

    return {
      success: true,
      collection: {
        id: created.id,
        workspaceId: created.tenantId,
        name: created.name,
        description: created.description,
        color: created.color,
        icon: created.icon,
        documentCount: 0,
        isSmartCollection: true,
        smartFilter: created.smartFilter,
        createdAt: created.createdAt?.toISOString() ?? "",
        updatedAt: created.updatedAt?.toISOString() ?? "",
      },
    }
  } catch (error) {
    logError(error, { operation: "createSmartCollectionAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Reorder collections.
 */
export async function reorderCollectionsAction(
  collectionIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    for (let i = 0; i < collectionIds.length; i++) {
      await db
        .update(magicdriveCollections)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(magicdriveCollections.id, collectionIds[i]))
    }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { operation: "reorderCollectionsAction" })
    return { success: false, error: String(error) }
  }
}

