/**
 * @domain magicdrive
 * @layer client-store
 * @responsibility Enhanced state management for unified magicdrive experience
 * Supports intelligent filtering, mobile-first interactions, and bulk operations
 */

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'

// Types for the enhanced magicdrive experience
export type ViewMode = 'cards' | 'table' | 'board' | 'timeline' | 'relationship' | 'list'
export type SortBy = 'createdAt' | 'title' | 'sizeBytes' | 'updatedAt' | 'relevance'
export type SortOrder = 'asc' | 'desc'

export interface SmartFilter {
  status?: 'inbox' | 'active' | 'archived' | 'deleted' | 'all'
  type?: 'invoice' | 'contract' | 'receipt' | 'other'
  tags?: string[]
  /** When true, only include items that have at least one tag */
  hasTags?: boolean
  /** When true, only include items with a set doc type */
  hasType?: boolean
  dateRange?: { from: string; to: string }
  searchQuery?: string
  isStarred?: boolean
  isPinned?: boolean
  sharedWithMe?: boolean
  sharedByMe?: boolean
}

export interface DocumentItem {
  id: string
  title: string | null
  docType: string
  status: string
  createdAt: string
  updatedAt?: string
  tags?: { id: string; name: string; slug: string }[]
  version?: {
    id: string
    mimeType: string
    sizeBytes: number
    sha256: string
  }
  preview?: {
    thumbnail?: string
    extracted?: string
  }
  aiClassifications?: {
    confidence: number
    suggestedTags: string[]
    duplicateGroupId?: string
  }
  // User preferences
  isStarred?: boolean
  isPinned?: boolean
  // Sharing info
  sharedWithMe?: boolean
  sharedByMe?: boolean
  sharedWith?: { userId: string; email: string; permission: 'view' | 'edit' }[]
}

// Document Hub Store - Unified interface
interface DocumentHubState {
  // View state
  viewMode: ViewMode
  sortBy: SortBy
  sortOrder: SortOrder
  filters: SmartFilter
  /** Route-derived initial filter (e.g. from pathname); not persisted */
  initialFilterFromRoute: Partial<SmartFilter> | null

  // Data state
  documents: DocumentItem[]
  totalCount: number
  loading: boolean
  error: string | null

  // Selection state
  selectedIds: Set<string>
  lastSelectedId: string | null

  // UI state
  showBulkActions: boolean
  showFilters: boolean
  isMobile: boolean

  // Actions
  setViewMode: (mode: ViewMode) => void
  setSorting: (sortBy: SortBy, sortOrder: SortOrder) => void
  setFilters: (filters: Partial<SmartFilter>) => void
  setInitialFilterFromRoute: (f: Partial<SmartFilter> | null) => void
  clearFilters: () => void

  setDocuments: (documents: DocumentItem[], totalCount: number) => void
  addDocuments: (documents: DocumentItem[]) => void
  updateDocument: (id: string, updates: Partial<DocumentItem>) => void
  removeDocument: (id: string) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Selection actions
  selectDocument: (id: string, multi?: boolean) => void
  deselectDocument: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  toggleSelection: (id: string) => void

  // UI actions
  toggleBulkActions: () => void
  toggleFilters: () => void
  setMobile: (isMobile: boolean) => void
}

const hubPartialize = (state: DocumentHubState) => ({
  viewMode: state.viewMode,
  sortBy: state.sortBy,
  sortOrder: state.sortOrder,
  filters: state.filters,
})

export const useDocumentHubStore = create<DocumentHubState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial state
        viewMode: 'cards',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        filters: {
          status: 'inbox'
        },
        initialFilterFromRoute: null,
        documents: [],
        totalCount: 0,
        loading: false,
        error: null,
        selectedIds: new Set(),
        lastSelectedId: null,
        showBulkActions: false,
        showFilters: false,
        isMobile: false,

        // View actions
        setViewMode: (mode) => set({ viewMode: mode }),
        setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters }
          })),
        setInitialFilterFromRoute: (f) => set({ initialFilterFromRoute: f }),
        clearFilters: () =>
          set({
            filters: { status: 'inbox' }
          }),

        // Data actions
        setDocuments: (documents, totalCount) =>
          set({ documents, totalCount }),

        addDocuments: (newDocuments) =>
          set((state) => ({
            documents: [...state.documents, ...newDocuments],
            totalCount: state.totalCount + newDocuments.length
          })),

        updateDocument: (id, updates) =>
          set((state) => ({
            documents: state.documents.map(doc =>
              doc.id === id ? { ...doc, ...updates } : doc
            )
          })),

        removeDocument: (id) =>
          set((state) => ({
            documents: state.documents.filter(doc => doc.id !== id),
            totalCount: state.totalCount - 1,
            selectedIds: new Set([...state.selectedIds].filter(selectedId => selectedId !== id))
          })),

        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),

        // Selection actions
        selectDocument: (id, multi = false) => {
          const state = get()
          const newSelectedIds = new Set(state.selectedIds)

          if (!multi) {
            newSelectedIds.clear()
            newSelectedIds.add(id)
          } else {
            if (state.lastSelectedId) {
              // Range selection
              const documents = state.documents
              const lastIndex = documents.findIndex(doc => doc.id === state.lastSelectedId)
              const currentIndex = documents.findIndex(doc => doc.id === id)

              if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex)
                const end = Math.max(lastIndex, currentIndex)

                for (let i = start; i <= end; i++) {
                  newSelectedIds.add(documents[i].id)
                }
              }
            } else {
              newSelectedIds.add(id)
            }
          }

          set({
            selectedIds: newSelectedIds,
            lastSelectedId: id,
            showBulkActions: newSelectedIds.size > 0
          })
        },

        deselectDocument: (id) => {
          const newSelectedIds = new Set(get().selectedIds)
          newSelectedIds.delete(id)

          set({
            selectedIds: newSelectedIds,
            showBulkActions: newSelectedIds.size > 0
          })
        },

        selectAll: () => {
          const { documents } = get()
          const allIds = new Set(documents.map(doc => doc.id))

          set({
            selectedIds: allIds,
            showBulkActions: true
          })
        },

        clearSelection: () =>
          set({
            selectedIds: new Set(),
            lastSelectedId: null,
            showBulkActions: false
          }),

        toggleSelection: (id) => {
          const { selectedIds } = get()
          const newSelectedIds = new Set(selectedIds)

          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id)
          } else {
            newSelectedIds.add(id)
          }

          set({
            selectedIds: newSelectedIds,
            showBulkActions: newSelectedIds.size > 0
          })
        },

        // UI actions
        toggleBulkActions: () =>
          set((state) => ({ showBulkActions: !state.showBulkActions })),

        toggleFilters: () =>
          set((state) => ({ showFilters: !state.showFilters })),

        setMobile: (isMobile) => set({ isMobile })
      })),
      {
        name: 'magicdrive-hub',
        partialize: hubPartialize,
      }
    ),
    { name: 'magicdrive' }
  )
)

// Upload Store - Enhanced upload experience
interface UploadState {
  queue: UploadItem[]
  activeUploads: Set<string>
  completedUploads: Set<string>
  failedUploads: Set<string>

  // UI state
  isDragOver: boolean
  showUploadDialog: boolean

  // Actions
  addToQueue: (files: File[]) => void
  removeFromQueue: (uploadId: string) => void
  startUpload: (uploadId: string) => void
  updateProgress: (uploadId: string, progress: number, status?: 'uploading' | 'processing') => void
  completeUpload: (uploadId: string, result: { documentId: string; url: string }) => void
  failUpload: (uploadId: string, error: string) => void

  setDragOver: (isDragOver: boolean) => void
  toggleUploadDialog: () => void
  clearCompleted: () => void
}

interface UploadItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  result?: { documentId: string; url: string }
}

export const useUploadStore = create<UploadState>()(
  devtools((set, _get) => ({
    queue: [],
    activeUploads: new Set(),
    completedUploads: new Set(),
    failedUploads: new Set(),
    isDragOver: false,
    showUploadDialog: false,

    addToQueue: (files) => {
      const uploadItems: UploadItem[] = files.map(file => ({
        id: `${file.name}-${Date.now()}`,
        file,
        status: 'pending',
        progress: 0
      }))

      set((state) => ({
        queue: [...state.queue, ...uploadItems]
      }))
    },

    removeFromQueue: (uploadId) =>
      set((state) => ({
        queue: state.queue.filter(item => item.id !== uploadId),
        activeUploads: new Set([...state.activeUploads].filter(id => id !== uploadId)),
        completedUploads: new Set([...state.completedUploads].filter(id => id !== uploadId)),
        failedUploads: new Set([...state.failedUploads].filter(id => id !== uploadId))
      })),

    startUpload: (uploadId) =>
      set((state) => ({
        queue: state.queue.map(item =>
          item.id === uploadId
            ? { ...item, status: 'uploading', progress: 0 }
            : item
        ),
        activeUploads: new Set([...state.activeUploads, uploadId])
      })),

    updateProgress: (uploadId, progress, status) =>
      set((state) => ({
        queue: state.queue.map(item =>
          item.id === uploadId
            ? { ...item, progress, status: status ?? item.status }
            : item
        ),
      })),

    completeUpload: (uploadId, result) =>
      set((state) => ({
        queue: state.queue.map(item =>
          item.id === uploadId
            ? { ...item, status: 'completed', progress: 100, result }
            : item
        ),
        activeUploads: new Set([...state.activeUploads].filter(id => id !== uploadId)),
        completedUploads: new Set([...state.completedUploads, uploadId])
      })),

    failUpload: (uploadId, error) =>
      set((state) => ({
        queue: state.queue.map(item =>
          item.id === uploadId
            ? { ...item, status: 'failed', error }
            : item
        ),
        activeUploads: new Set([...state.activeUploads].filter(id => id !== uploadId)),
        failedUploads: new Set([...state.failedUploads, uploadId])
      })),

    setDragOver: (isDragOver) => set({ isDragOver }),
    toggleUploadDialog: () =>
      set((state) => ({ showUploadDialog: !state.showUploadDialog })),

    clearCompleted: () =>
      set((state) => ({
        queue: state.queue.filter(item => !state.completedUploads.has(item.id)),
        completedUploads: new Set()
      }))
  }), { name: 'magicdrive-upload' })
)
