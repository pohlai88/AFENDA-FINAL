/**
 * @domain magicdrive
 * @layer client
 * @responsibility UI-only: multi-select for bulk actions (tag, archive, move)
 * Selection state survives pagination/infinite scroll when used with selectAllInView.
 */

"use client"

import { create } from "zustand"

interface magicdriveSelectionStore {
  selectedIds: Set<string>

  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  selectAll: (ids: string[]) => void
  selectAllInView: (ids: string[]) => void
  clear: () => void
  setSelected: (ids: string[]) => void
}

export const usemagicdriveSelectionStore = create<magicdriveSelectionStore>((set, get) => ({
  selectedIds: new Set<string>(),

  isSelected: (id) => get().selectedIds.has(id),

  toggle: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next }
    }),

  selectAll: (ids) =>
    set((state) => {
      const next = new Set(state.selectedIds)
      const allSelected = ids.every((i) => next.has(i))
      if (allSelected) ids.forEach((i) => next.delete(i))
      else ids.forEach((i) => next.add(i))
      return { selectedIds: next }
    }),

  selectAllInView: (ids) =>
    set((state) => {
      const next = new Set(state.selectedIds)
      const allInViewSelected = ids.length > 0 && ids.every((i) => next.has(i))
      if (allInViewSelected) ids.forEach((i) => next.delete(i))
      else ids.forEach((i) => next.add(i))
      return { selectedIds: next }
    }),

  clear: () => set({ selectedIds: new Set() }),

  setSelected: (ids) => set({ selectedIds: new Set(ids) }),
}))
