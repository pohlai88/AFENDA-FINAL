/**
 * Task indicator hooks and types for magictodo UI.
 *
 * @domain magictodo
 * @layer hooks
 */

"use client";

import { useMemo } from "react";

/**
 * Indicator data for task cards — optional enriched metadata.
 * Single source of truth for task indicators across all magictodo components.
 */
export interface TaskIndicators {
  isSnoozed?: boolean;
  snoozedUntil?: string;
  isBlocked?: boolean;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  hasActiveTimer?: boolean;
  totalTimeSpent?: number;
  commentCount?: number;
  attachmentCount?: number;
  dependencyCount?: number;
}

/**
 * Returns a map of task indicators keyed by task ID.
 * Currently returns static defaults — replace with real data fetching
 * when snooze/blocked/subtask APIs are wired up.
 */
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
        completedSubtaskCount: 0,
        hasActiveTimer: false,
        totalTimeSpent: 0,
        commentCount: 0,
        attachmentCount: 0,
        dependencyCount: 0,
      });
    });
    return map;
  }, [taskIds, enabled]);

  return { indicatorsMap, isLoading: false };
}
