"use client";

import { create } from "zustand";

export type KanbanGroupBy = "status" | "priority" | "project";

interface KanbanState {
  groupBy: KanbanGroupBy;
  showSubtasks: boolean;
  setGroupBy: (groupBy: KanbanGroupBy) => void;
  setShowSubtasks: (show: boolean) => void;
}

export const useKanbanStore = create<KanbanState>((set) => ({
  groupBy: "status",
  showSubtasks: true,
  setGroupBy: (groupBy) => set({ groupBy }),
  setShowSubtasks: (showSubtasks) => set({ showSubtasks }),
}));
