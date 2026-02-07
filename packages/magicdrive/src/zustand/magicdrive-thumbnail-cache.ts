/**
 * @domain magicdrive
 * @layer client
 * @responsibility Thumbnail cache store - prevents duplicate thumbnail fetches
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThumbnailCacheState {
  thumbnails: Map<string, string | null>
  loading: Set<string>
  getThumbnail: (id: string) => string | null | undefined
  setThumbnail: (id: string, url: string | null) => void
  isLoading: (id: string) => boolean
  setLoading: (id: string, loading: boolean) => void
  clearCache: () => void
}

export const useThumbnailCache = create<ThumbnailCacheState>()(
  persist(
    (set, get) => ({
      thumbnails: new Map(),
      loading: new Set(),

      getThumbnail: (id: string) => {
        return get().thumbnails.get(id)
      },

      setThumbnail: (id: string, url: string | null) => {
        set((state) => {
          const newThumbnails = new Map(state.thumbnails)
          newThumbnails.set(id, url)
          const newLoading = new Set(state.loading)
          newLoading.delete(id)
          return {
            thumbnails: newThumbnails,
            loading: newLoading,
          }
        })
      },

      isLoading: (id: string) => {
        return get().loading.has(id)
      },

      setLoading: (id: string, loading: boolean) => {
        set((state) => {
          const newLoading = new Set(state.loading)
          if (loading) {
            newLoading.add(id)
          } else {
            newLoading.delete(id)
          }
          return { loading: newLoading }
        })
      },

      clearCache: () => {
        set({ thumbnails: new Map(), loading: new Set() })
      },
    }),
    {
      name: 'magicdrive-thumbnail-cache',
      // Custom storage to handle Map serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const { state } = JSON.parse(str)
          return {
            state: {
              ...state,
              thumbnails: new Map(state.thumbnails || []),
              loading: new Set(state.loading || []),
            },
          }
        },
        setItem: (name, value) => {
          const { state } = value
          const serialized = {
            state: {
              ...state,
              thumbnails: Array.from(state.thumbnails.entries()),
              loading: Array.from(state.loading),
            },
          }
          localStorage.setItem(name, JSON.stringify(serialized))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
