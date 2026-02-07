/**
 * @domain magicdrive
 * @layer client
 * @responsibility UI-only: upload queue, progress, status per file
 * Truth (final documents) stays server-side; this store drives progress UI and retry.
 */

"use client"

import { create } from "zustand"

export type UploadItemStatus =
  | "hashing"
  | "presigning"
  | "uploading"
  | "ingesting"
  | "done"
  | "failed"

export type UploadItem = {
  id: string
  file: File
  filename: string
  mimeType: string
  sizeBytes: number
  status: UploadItemStatus
  progress: number // 0–100
  error?: string
  uploadId?: string
  objectId?: string
  versionId?: string
}

interface magicdriveUploadStore {
  items: UploadItem[]

  add: (file: File) => string
  remove: (id: string) => void
  update: (id: string, update: Partial<Pick<UploadItem, "status" | "progress" | "error" | "uploadId" | "objectId" | "versionId">>) => void
  clearCompleted: () => void
  clearAll: () => void
}

function generateId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export const usemagicdriveUploadStore = create<magicdriveUploadStore>((set, _get) => ({
  items: [],

  add: (file) => {
    const id = generateId()
    const item: UploadItem = {
      id,
      file,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      status: "hashing",
      progress: 0,
    }
    set((state) => ({ items: [...state.items, item] }))
    return id
  },

  remove: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  update: (id, update) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...update } : i)),
    })),

  clearCompleted: () =>
    set((state) => ({
      items: state.items.filter((i) => i.status !== "done" && i.status !== "failed"),
    })),

  clearAll: () => set({ items: [] }),
}))
