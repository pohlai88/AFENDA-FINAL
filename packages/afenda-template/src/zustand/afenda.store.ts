/**
 * Afenda Domain Store Example
 * Following official Zustand patterns for Next.js
 * @see ./README.md for full documentation
 */
"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type AfendaState = {
  /** Current view mode */
  view: "list" | "grid" | "kanban";
  /** Sidebar visibility */
  sidebarOpen: boolean;
  /** Compact mode for dense layouts */
  compactMode: boolean;
};

export type AfendaActions = {
  setView: (view: AfendaState["view"]) => void;
  toggleSidebar: () => void;
  toggleCompactMode: () => void;
  reset: () => void;
};

export type AfendaStore = AfendaState & AfendaActions;

// ============================================================================
// Default State
// ============================================================================

const defaultState: AfendaState = {
  view: "list",
  sidebarOpen: true,
  compactMode: false,
};

// ============================================================================
// Store
// ============================================================================

/**
 * Afenda UI preferences store.
 * Persists user preferences to localStorage.
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { useAfendaStore } from '@afenda/afenda/zustand'
 * 
 * function ViewToggle() {
 *   const view = useAfendaStore((s) => s.view)
 *   const setView = useAfendaStore((s) => s.setView)
 *   return <button onClick={() => setView('grid')}>{view}</button>
 * }
 * ```
 */
export const useAfendaStore = create<AfendaStore>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,
        setView: (view) => set({ view }, undefined, "afenda/setView"),
        toggleSidebar: () =>
          set(
            (s) => ({ sidebarOpen: !s.sidebarOpen }),
            undefined,
            "afenda/toggleSidebar"
          ),
        toggleCompactMode: () =>
          set(
            (s) => ({ compactMode: !s.compactMode }),
            undefined,
            "afenda/toggleCompactMode"
          ),
        reset: () => set(defaultState, undefined, "afenda/reset"),
      }),
      {
        name: "afenda-preferences",
        partialize: (state) => ({
          view: state.view,
          sidebarOpen: state.sidebarOpen,
          compactMode: state.compactMode,
        }),
      }
    ),
    { name: "AfendaStore" }
  )
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Pre-built selectors for common use cases.
 * Use with the store for optimized re-renders.
 * 
 * @example
 * ```tsx
 * const view = useAfendaStore(afendaSelectors.view)
 * ```
 */
export const afendaSelectors = {
  view: (s: AfendaStore) => s.view,
  sidebarOpen: (s: AfendaStore) => s.sidebarOpen,
  compactMode: (s: AfendaStore) => s.compactMode,
  preferences: (s: AfendaStore) => ({
    view: s.view,
    sidebarOpen: s.sidebarOpen,
    compactMode: s.compactMode,
  }),
};
