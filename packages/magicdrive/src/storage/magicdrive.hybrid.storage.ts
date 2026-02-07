/**
 * @layer domain (magicdrive)
 * @responsibility Hybrid storage adapter (IndexedDB + server sync).
 */

import { getmagicdriveDB, type CachedDocument, type CachedFolder, type PendingUpload } from "./magicdrive.indexeddb.storage"
import type { Document } from "../zod/magicdrive.document.zod"
import type { Folder } from "../zod/magicdrive.folder.zod"

/**
 * Cache documents from server response.
 */
export async function cacheDocuments(documents: Document[]): Promise<void> {
  const db = getmagicdriveDB()
  const now = Date.now()

  const cached: CachedDocument[] = documents.map((doc) => ({
    ...doc,
    _syncStatus: "synced" as const,
    _localUpdatedAt: now,
  }))

  await db.documents.bulkPut(cached)
}

/**
 * Get documents from cache.
 */
export async function getCachedDocuments(
  workspaceId: string,
  folderId?: string | null
): Promise<CachedDocument[]> {
  const db = getmagicdriveDB()

  if (folderId !== undefined) {
    return db.documents
      .where({ workspaceId, folderId: folderId ?? null })
      .toArray()
  }

  return db.documents.where("workspaceId").equals(workspaceId).toArray()
}

/**
 * Get single document from cache.
 */
export async function getCachedDocument(id: string): Promise<CachedDocument | undefined> {
  const db = getmagicdriveDB()
  return db.documents.get(id)
}

/**
 * Update document in cache (mark as pending sync).
 */
export async function updateCachedDocument(
  id: string,
  updates: Partial<Document>
): Promise<void> {
  const db = getmagicdriveDB()
  await db.documents.update(id, {
    ...updates,
    _syncStatus: "pending",
    _localUpdatedAt: Date.now(),
  })
}

/**
 * Remove document from cache.
 */
export async function removeCachedDocument(id: string): Promise<void> {
  const db = getmagicdriveDB()
  await db.documents.delete(id)
}

/**
 * Cache folders from server response.
 */
export async function cacheFolders(folders: Folder[]): Promise<void> {
  const db = getmagicdriveDB()
  const now = Date.now()

  const cached: CachedFolder[] = folders.map((folder) => ({
    ...folder,
    _syncStatus: "synced" as const,
    _localUpdatedAt: now,
  }))

  await db.folders.bulkPut(cached)
}

/**
 * Get folders from cache.
 */
export async function getCachedFolders(workspaceId: string): Promise<CachedFolder[]> {
  const db = getmagicdriveDB()
  return db.folders.where("workspaceId").equals(workspaceId).toArray()
}

/**
 * Queue file for upload when offline.
 */
export async function queuePendingUpload(params: {
  workspaceId: string
  folderId: string | null
  file: File
}): Promise<string> {
  const db = getmagicdriveDB()
  const id = crypto.randomUUID()

  const pending: PendingUpload = {
    id,
    workspaceId: params.workspaceId,
    folderId: params.folderId,
    filename: params.file.name,
    mimeType: params.file.type,
    sizeBytes: params.file.size,
    fileBlob: params.file,
    status: "pending",
    createdAt: Date.now(),
    retryCount: 0,
  }

  await db.pendingUploads.add(pending)
  return id
}

/**
 * Get all pending uploads.
 */
export async function getPendingUploads(): Promise<PendingUpload[]> {
  const db = getmagicdriveDB()
  return db.pendingUploads.where("status").equals("pending").toArray()
}

/**
 * Update pending upload status.
 */
export async function updatePendingUpload(
  id: string,
  updates: Partial<PendingUpload>
): Promise<void> {
  const db = getmagicdriveDB()
  await db.pendingUploads.update(id, updates)
}

/**
 * Remove pending upload (after successful sync).
 */
export async function removePendingUpload(id: string): Promise<void> {
  const db = getmagicdriveDB()
  await db.pendingUploads.delete(id)
}

/**
 * Get items that need to be synced.
 */
export async function getPendingSyncItems(): Promise<{
  documents: CachedDocument[]
  folders: CachedFolder[]
  uploads: PendingUpload[]
}> {
  const db = getmagicdriveDB()

  const [documents, folders, uploads] = await Promise.all([
    db.documents.where("_syncStatus").equals("pending").toArray(),
    db.folders.where("_syncStatus").equals("pending").toArray(),
    db.pendingUploads.where("status").equals("pending").toArray(),
  ])

  return { documents, folders, uploads }
}

/**
 * Mark items as synced.
 */
export async function markAsSynced(itemIds: string[]): Promise<void> {
  const db = getmagicdriveDB()
  await db.documents
    .where("id")
    .anyOf(itemIds)
    .modify({ _syncStatus: "synced" })
}
