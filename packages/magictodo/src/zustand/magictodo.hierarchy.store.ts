"use client";

import { create } from "zustand";

export type HierarchyBreadcrumb = {
  id: string;
  title: string;
  hierarchyCode?: string;
  level: number;
};

interface HierarchyExpansionState {
  expandedIds: Set<string>;
  toggle: (id: string) => void;
  expandAll: (ids?: string[]) => void;
  collapseAll: () => void;
  expandToLevel: (level: number) => void;
}

interface HierarchyNavigationState {
  currentRootId: string | null;
  breadcrumbs: HierarchyBreadcrumb[];
  drillDown: (id: string, breadcrumb: HierarchyBreadcrumb) => void;
  drillUp: () => void;
  navigateToBreadcrumb: (id: string) => void;
  clearNavigation: () => void;
}

interface HierarchySelectionState {
  selectedId: string | null;
  select: (id: string | null) => void;
}

interface HierarchyPreferencesState {
  maxDepth: number;
  showCompleted: boolean;
  autoExpand: boolean;
  setMaxDepth: (value: number) => void;
  setShowCompleted: (value: boolean) => void;
  setAutoExpand: (value: boolean) => void;
}

export const useHierarchyExpansion = create<HierarchyExpansionState>((set) => ({
  expandedIds: new Set<string>(),
  toggle: (id) =>
    set((state) => {
      const next = new Set(state.expandedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { expandedIds: next };
    }),
  expandAll: (ids) =>
    set(() => ({ expandedIds: new Set(ids ?? []) })),
  collapseAll: () => set(() => ({ expandedIds: new Set<string>() })),
  expandToLevel: () => {
    // TODO: Implement level-based expansion when hierarchy metadata is available
  },
}));

export const useHierarchyNavigation = create<HierarchyNavigationState>((set, get) => ({
  currentRootId: null,
  breadcrumbs: [],
  drillDown: (id, breadcrumb) =>
    set((state) => ({
      currentRootId: id,
      breadcrumbs: [...state.breadcrumbs, breadcrumb],
    })),
  drillUp: () =>
    set((state) => {
      const next = state.breadcrumbs.slice(0, -1);
      const nextRoot = next.length ? next[next.length - 1]?.id ?? null : null;
      return { breadcrumbs: next, currentRootId: nextRoot };
    }),
  navigateToBreadcrumb: (id) =>
    set((state) => {
      const index = state.breadcrumbs.findIndex((crumb) => crumb.id === id);
      if (index === -1) return state;
      const next = state.breadcrumbs.slice(0, index + 1);
      return { breadcrumbs: next, currentRootId: id };
    }),
  clearNavigation: () => set(() => ({ currentRootId: null, breadcrumbs: [] })),
}));

export const useHierarchySelection = create<HierarchySelectionState>((set) => ({
  selectedId: null,
  select: (id) => set(() => ({ selectedId: id })),
}));

export const useHierarchyPreferences = create<HierarchyPreferencesState>((set) => ({
  maxDepth: 5,
  showCompleted: true,
  autoExpand: true,
  setMaxDepth: (value) => set(() => ({ maxDepth: value })),
  setShowCompleted: (value) => set(() => ({ showCompleted: value })),
  setAutoExpand: (value) => set(() => ({ autoExpand: value })),
}));

// Backward compatibility alias for legacy imports
export const useHierarchyStore = useHierarchyNavigation;
