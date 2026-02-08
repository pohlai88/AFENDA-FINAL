"use client";

import { useMemo, useEffect, useCallback } from "react";

/** Keyboard shortcut category for help dialogs */
export type KeyboardShortcutCategory = {
  category: string;
  shortcuts: { keys: string; description: string }[];
};

/** Returns MagicDrive keyboard shortcuts for help UI */
export function getKeyboardShortcutList(): KeyboardShortcutCategory[] {
  return [
    {
      category: "Navigation",
      shortcuts: [
        { keys: "g then d", description: "Go to dashboard" },
        { keys: "g then i", description: "Go to inbox" },
        { keys: "g then f", description: "Go to files" },
      ],
    },
    {
      category: "Actions",
      shortcuts: [
        { keys: "u", description: "Upload files" },
        { keys: "r", description: "Refresh" },
        { keys: "/", description: "Focus search" },
        { keys: "?", description: "Show keyboard shortcuts" },
      ],
    },
    {
      category: "Selection",
      shortcuts: [
        { keys: "Ctrl+A", description: "Select all" },
        { keys: "Escape", description: "Clear selection" },
      ],
    },
  ];
}

/** Options for useKeyboardShortcuts (MagicDrive document hub) */
export type UseKeyboardShortcutsOptions = {
  onViewModeChange?: (mode: "grid" | "list" | "columns") => void;
  onRefresh?: () => void;
  onUpload?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
};

/** Registers MagicDrive keyboard shortcuts */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    onViewModeChange: _onViewModeChange,
    onRefresh,
    onUpload,
    onSelectAll,
    onClearSelection,
  } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput) return;

      if (e.key === "Escape" && onClearSelection) {
        onClearSelection();
        return;
      }
      if (e.key === "r" && !e.ctrlKey && !e.metaKey && onRefresh) {
        onRefresh();
        return;
      }
      if (e.key === "u" && !e.ctrlKey && !e.metaKey && onUpload) {
        e.preventDefault();
        onUpload();
        return;
      }
      if (e.ctrlKey && e.key === "a" && onSelectAll) {
        e.preventDefault();
        onSelectAll();
        return;
      }
      if (e.metaKey && e.key === "a" && onSelectAll) {
        e.preventDefault();
        onSelectAll();
        return;
      }
    },
    [onRefresh, onUpload, onSelectAll, onClearSelection]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export type TaskIndicators = {
  isSnoozed?: boolean;
  isBlocked?: boolean;
  subtaskCount?: number;
  hasActiveTimer?: boolean;
};

export function useTaskIndicators(
  taskIds: string[],
  options?: { enabled?: boolean }
): { indicatorsMap: Map<string, TaskIndicators>; isLoading: boolean } {
  const enabled = options?.enabled ?? true;

  const indicatorsMap = useMemo(() => {
    const map = new Map<string, TaskIndicators>();
    if (!enabled) return map;
    taskIds.forEach((id) => {
      map.set(id, {
        isSnoozed: false,
        isBlocked: false,
        subtaskCount: 0,
        hasActiveTimer: false,
      });
    });
    return map;
  }, [taskIds, enabled]);

  return { indicatorsMap, isLoading: false };
}
