/**
 * Shared Bulk Actions Hooks
 * React hooks for bulk selection management
 */

"use client";

import * as React from "react";
import type { UseBulkSelectionReturn } from "./types";

/**
 * Hook for managing bulk selection state
 * 
 * @example
 * const { selectedItems, toggleItem, toggleAll, clearSelection } = useBulkSelection(
 *   items,
 *   (item) => item.id
 * );
 */
export function useBulkSelection<T>(
  items: T[],
  getItemId: (item: T) => string
): UseBulkSelectionReturn<T> {
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());

  const allItemIds = React.useMemo(
    () => new Set(items.map(getItemId)),
    [items, getItemId]
  );

  const selectedData = React.useMemo(
    () => items.filter((item) => selectedItems.has(getItemId(item))),
    [items, selectedItems, getItemId]
  );

  const isAllSelected = items.length > 0 && selectedItems.size === items.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < items.length;

  const toggleItem = React.useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const toggleAll = React.useCallback(() => {
    setSelectedItems((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(allItemIds);
    });
  }, [items.length, allItemIds]);

  const clearSelection = React.useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isSelected = React.useCallback(
    (itemId: string) => selectedItems.has(itemId),
    [selectedItems]
  );

  return {
    selectedItems,
    selectedData,
    isAllSelected,
    isIndeterminate,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    selectedCount: selectedItems.size,
  };
}
