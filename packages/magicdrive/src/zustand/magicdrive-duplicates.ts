/**
 * @domain magicdrive
 * @layer client
 * @responsibility UI-only: Keep Best workflow — active group, chosen version, preview mode
 * Commit to server on confirm; this store holds temporary UI decision.
 */

"use client"

import { create } from "zustand"

interface magicdriveDuplicatesStore {
  activeGroupId: string | null
  chosenKeepVersionId: Record<string, string> // groupId -> versionId
  previewMode: boolean

  setActiveGroup: (groupId: string | null) => void
  setChosenKeepVersion: (groupId: string, versionId: string) => void
  clearChoice: (groupId: string) => void
  setPreviewMode: (on: boolean) => void
  reset: () => void
}

export const usemagicdriveDuplicatesStore = create<magicdriveDuplicatesStore>((set, _get) => ({
  activeGroupId: null,
  chosenKeepVersionId: {},
  previewMode: false,

  setActiveGroup: (activeGroupId) => set({ activeGroupId }),

  setChosenKeepVersion: (groupId, versionId) =>
    set((state) => ({
      chosenKeepVersionId: { ...state.chosenKeepVersionId, [groupId]: versionId },
    })),

  clearChoice: (groupId) =>
    set((state) => {
      const next = { ...state.chosenKeepVersionId }
      delete next[groupId]
      return { chosenKeepVersionId: next }
    }),

  setPreviewMode: (previewMode) => set({ previewMode }),

  reset: () =>
    set({
      activeGroupId: null,
      chosenKeepVersionId: {},
      previewMode: false,
    }),
}))
