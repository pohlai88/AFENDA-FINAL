/**
 * @layer domain (magicdrive)
 * @responsibility Hook for document selection and bulk operations.
 */

"use client"

import { useCallback, useMemo } from "react"
import { usemagicdriveStore } from "../zustand/magicdrive.store.zustand"
import type { Document } from "../zod/magicdrive.document.zod"

/**
 * Hook for managing document selection.
 */
export function useDocumentSelection() {
  const selectedIds = usemagicdriveStore((s) => s.selectedIds)
  const documents = usemagicdriveStore((s) => s.documents)
  const selectItem = usemagicdriveStore((s) => s.selectItem)
  const deselectItem = usemagicdriveStore((s) => s.deselectItem)
  const toggleSelection = usemagicdriveStore((s) => s.toggleSelection)
  const selectAll = usemagicdriveStore((s) => s.selectAll)
  const clearSelection = usemagicdriveStore((s) => s.clearSelection)

  const selectedCount = selectedIds.size
  const hasSelection = selectedCount > 0
  const allSelected = documents.length > 0 && selectedCount === documents.length
  const someSelected = hasSelection && !allSelected

  const selectedDocuments = useMemo(() => {
    return documents.filter((doc) => selectedIds.has(doc.id))
  }, [documents, selectedIds])

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection()
    } else {
      selectAll()
    }
  }, [allSelected, clearSelection, selectAll])

  /**
   * Handle shift+click range selection.
   */
  const selectRange = useCallback(
    (startId: string, endId: string) => {
      const startIdx = documents.findIndex((d) => d.id === startId)
      const endIdx = documents.findIndex((d) => d.id === endId)

      if (startIdx === -1 || endIdx === -1) return

      const [minIdx, maxIdx] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]

      for (let i = minIdx; i <= maxIdx; i++) {
        selectItem(documents[i].id)
      }
    },
    [documents, selectItem]
  )

  return {
    selectedIds,
    selectedCount,
    selectedDocuments,
    hasSelection,
    allSelected,
    someSelected,
    isSelected,
    selectItem,
    deselectItem,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    selectRange,
  }
}
