import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SavedView } from "@afenda/magicdrive/zod"

interface SavedViewsStore {
  views: SavedView[]
  lastFetched: number | null
  loading: boolean
  setViews: (views: SavedView[]) => void
  addView: (view: SavedView) => void
  updateView: (id: string, updates: Partial<SavedView>) => void
  deleteView: (id: string) => void
  shouldRefetch: () => boolean
  reset: () => void
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useSavedViewsStore = create<SavedViewsStore>()(
  persist(
    (set, get) => ({
      views: [],
      lastFetched: null,
      loading: false,

      setViews: (views) =>
        set({
          views,
          lastFetched: Date.now(),
          loading: false,
        }),

      addView: (view) =>
        set((state) => ({
          views: [...state.views, view],
        })),

      updateView: (id, updates) =>
        set((state) => ({
          views: state.views.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        })),

      deleteView: (id) =>
        set((state) => ({
          views: state.views.filter((v) => v.id !== id),
        })),

      shouldRefetch: () => {
        const { lastFetched } = get()
        return !lastFetched || Date.now() - lastFetched > CACHE_DURATION
      },

      reset: () =>
        set({
          views: [],
          lastFetched: null,
          loading: false,
        }),
    }),
    {
      name: "magicdrive-saved-views",
      // Only persist views and lastFetched, not loading state
      partialize: (state) => ({
        views: state.views,
        lastFetched: state.lastFetched,
      }),
    }
  )
)
