/**
 * @domain magicdrive
 * @layer client
 * @responsibility UI-only: search filters, sort, viewMode, recent searches
 * Truth (documents) stays server-side; this store keeps filters from resetting on navigate.
 */

"use client"

import { create } from "zustand"

import type { DocType, Status } from "@afenda/magicdrive/zod"

export type magicdriveSortBy = "createdAt" | "title" | "sizeBytes" | "docType"
export type magicdriveSortOrder = "asc" | "desc"
export type magicdriveViewMode = "list" | "grid"

export type SavedView = {
  id: string
  name: string
  filters: magicdriveFilters
  sortBy: magicdriveSortBy
  sortOrder: magicdriveSortOrder
}

export type magicdriveFilters = {
  status?: Status
  docType?: DocType
  hasTags?: "0" | "1"
  hasType?: "0" | "1"
  tagId?: string // uuid
  dateFrom?: string // ISO date
  dateTo?: string
  /** Reserved for future; not yet used by API or UI */
  counterparty?: string
}

interface magicdriveSearchStore {
  filters: magicdriveFilters
  sortBy: magicdriveSortBy
  sortOrder: magicdriveSortOrder
  viewMode: magicdriveViewMode
  recentSearches: string[]

  setFilters: (filters: Partial<magicdriveFilters>) => void
  clearFilters: () => void
  setSort: (sortBy: magicdriveSortBy, sortOrder: magicdriveSortOrder) => void
  setViewMode: (viewMode: magicdriveViewMode) => void
  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void
}

const defaultFilters: magicdriveFilters = {}
const MAX_RECENT = 10

export const usemagicdriveSearchStore = create<magicdriveSearchStore>((set) => ({
  filters: defaultFilters,
  sortBy: "createdAt",
  sortOrder: "desc",
  viewMode: "list",
  recentSearches: [],

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: defaultFilters }),

  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

  setViewMode: (viewMode) => set({ viewMode }),

  addRecentSearch: (query) =>
    set((state) => {
      const trimmed = query.trim()
      if (!trimmed) return state
      const next = [trimmed, ...state.recentSearches.filter((q) => q !== trimmed)].slice(
        0,
        MAX_RECENT
      )
      return { recentSearches: next }
    }),

  clearRecentSearches: () => set({ recentSearches: [] }),
}))
