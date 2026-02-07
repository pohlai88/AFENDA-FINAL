/**
 * @layer domain (magicdrive)
 * @responsibility IndexedDB storage adapter for offline document cache.
 */

import Dexie, { type Table } from "dexie"
import type { Document } from "../zod/magicdrive.document.zod"
import type { Folder } from "../zod/magicdrive.folder.zod"

/**
 * Cached document (offline-ready).
 */
export interface CachedDocument extends Document {
  /** Sync status */
  _syncStatus: "synced" | "pending" | "error"
  /** Local modification timestamp */
  _localUpdatedAt: number
  /** Thumbnail blob URL (if cached) */
  _thumbnailBlob?: Blob
}

/**
 * Cached folder (offline-ready).
 */
export interface CachedFolder extends Folder {
  _syncStatus: "synced" | "pending" | "error"
  _localUpdatedAt: number
}

/**
 * Pending upload entry.
 */
export interface PendingUpload {
  id: string
  workspaceId: string
  folderId: string | null
  filename: string
  mimeType: string
  sizeBytes: number
  /** File blob stored locally */
  fileBlob: Blob
  /** SHA256 hash if computed */
  sha256?: string
  status: "pending" | "uploading" | "error"
  errorMessage?: string
  createdAt: number
  retryCount: number
}

/**
 * magicdrive IndexedDB database.
 */
export class magicdriveDB extends Dexie {
  documents!: Table<CachedDocument, string>
  folders!: Table<CachedFolder, string>
  pendingUploads!: Table<PendingUpload, string>

  constructor() {
    super("magicdrive")

    this.version(1).stores({
      documents: "id, workspaceId, folderId, status, _syncStatus, _localUpdatedAt",
      folders: "id, workspaceId, parentId, _syncStatus",
      pendingUploads: "id, workspaceId, status, createdAt",
    })
  }
}

/** Singleton database instance */
let dbInstance: magicdriveDB | null = null

/**
 * Get the magicdrive IndexedDB instance.
 */
export function getmagicdriveDB(): magicdriveDB {
  if (!dbInstance) {
    dbInstance = new magicdriveDB()
  }
  return dbInstance
}

/**
 * Clear all cached data.
 */
export async function clearmagicdriveCache(): Promise<void> {
  const db = getmagicdriveDB()
  await Promise.all([
    db.documents.clear(),
    db.folders.clear(),
  ])
}

/**
 * Get pending upload count.
 */
export async function getPendingUploadCount(): Promise<number> {
  const db = getmagicdriveDB()
  return db.pendingUploads.where("status").equals("pending").count()
}
