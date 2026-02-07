/**
 * @layer domain (magicdrive)
 * @responsibility Main Zustand store for magicdrive state.
 */

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { Folder, FolderTreeNode } from "../zod/magicdrive.folder.zod"
import type { Document } from "../zod/magicdrive.document.zod"
import type { SavedView } from "@afenda/shared/saved-views"

export type ViewMode = "grid" | "list" | "columns"
export type SortField = "name" | "createdAt" | "updatedAt" | "size" | "type"
export type SortOrder = "asc" | "desc"

export interface magicdriveState {
  /** Current folder ID being viewed */
  currentFolderId: string | null
  /** Folder tree (cached) */
  folderTree: FolderTreeNode[]
  /** Documents in current folder */
  documents: Document[]
  /** Selected document/folder IDs */
  selectedIds: Set<string>
  /** View mode */
  viewMode: ViewMode
  /** Sort configuration */
  sortField: SortField
  sortOrder: SortOrder
  /** Active saved view */
  activeSavedView: SavedView | null
  /** Search query */
  searchQuery: string
  /** Is loading */
  isLoading: boolean
}

export interface magicdriveActions {
  setCurrentFolder: (folderId: string | null) => void
  setFolderTree: (tree: FolderTreeNode[]) => void
  setDocuments: (docs: Document[]) => void
  addDocument: (doc: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  removeDocument: (id: string) => void
  // Selection
  selectItem: (id: string) => void
  deselectItem: (id: string) => void
  toggleSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  // View
  setViewMode: (mode: ViewMode) => void
  setSort: (field: SortField, order: SortOrder) => void
  setActiveSavedView: (view: SavedView | null) => void
  setSearchQuery: (query: string) => void
  setIsLoading: (loading: boolean) => void
  // Reset
  reset: () => void
}

const initialState: magicdriveState = {
  currentFolderId: null,
  folderTree: [],
  documents: [],
  selectedIds: new Set(),
  viewMode: "grid",
  sortField: "name",
  sortOrder: "asc",
  activeSavedView: null,
  searchQuery: "",
  isLoading: false,
}

export const usemagicdriveStore = create<magicdriveState & magicdriveActions>()(
  immer((set, get) => ({
    ...initialState,

    setCurrentFolder: (folderId) =>
      set((state) => {
        state.currentFolderId = folderId
        state.selectedIds = new Set()
      }),

    setFolderTree: (tree) =>
      set((state) => {
        state.folderTree = tree
      }),

    setDocuments: (docs) =>
      set((state) => {
        state.documents = docs
      }),

    addDocument: (doc) =>
      set((state) => {
        state.documents.push(doc)
      }),

    updateDocument: (id, updates) =>
      set((state) => {
        const idx = state.documents.findIndex((d) => d.id === id)
        if (idx !== -1) {
          Object.assign(state.documents[idx], updates)
        }
      }),

    removeDocument: (id) =>
      set((state) => {
        state.documents = state.documents.filter((d) => d.id !== id)
        state.selectedIds.delete(id)
      }),

    selectItem: (id) =>
      set((state) => {
        state.selectedIds.add(id)
      }),

    deselectItem: (id) =>
      set((state) => {
        state.selectedIds.delete(id)
      }),

    toggleSelection: (id) =>
      set((state) => {
        if (state.selectedIds.has(id)) {
          state.selectedIds.delete(id)
        } else {
          state.selectedIds.add(id)
        }
      }),

    selectAll: () =>
      set((state) => {
        state.selectedIds = new Set(state.documents.map((d) => d.id))
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedIds = new Set()
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode
      }),

    setSort: (field, order) =>
      set((state) => {
        state.sortField = field
        state.sortOrder = order
      }),

    setActiveSavedView: (view) =>
      set((state) => {
        state.activeSavedView = view
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query
      }),

    setIsLoading: (loading) =>
      set((state) => {
        state.isLoading = loading
      }),

    reset: () => set(initialState),
  }))
)
