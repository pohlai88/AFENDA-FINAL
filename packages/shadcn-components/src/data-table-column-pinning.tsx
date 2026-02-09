"use client"

/**
 * Column Pinning for DataTable
 * Pin/freeze columns to left or right side
 */

import * as React from "react"
import { IconPin, IconPinFilled, IconX } from "@tabler/icons-react"
import { type Column, type ColumnPinningState } from "@tanstack/react-table"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"

export interface ColumnPinningProps<TData> {
  column: Column<TData, unknown>
  pinningState: ColumnPinningState
  onPin: (columnId: string, position: "left" | "right" | false) => void
}

/**
 * Column Pin Button
 */
export function ColumnPinButton<TData>({
  column,
  pinningState,
  onPin,
}: ColumnPinningProps<TData>) {
  const isPinnedLeft = pinningState.left?.includes(column.id)
  const isPinnedRight = pinningState.right?.includes(column.id)
  const isPinned = isPinnedLeft || isPinnedRight

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label={isPinned ? "Unpin column" : "Pin column"}
        >
          {isPinned ? (
            <IconPinFilled className="size-3" />
          ) : (
            <IconPin className="size-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Pin Column</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onPin(column.id, "left")}
          disabled={isPinnedLeft}
        >
          <IconPin className="mr-2 size-4 -rotate-45" />
          Pin to Left
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onPin(column.id, "right")}
          disabled={isPinnedRight}
        >
          <IconPin className="mr-2 size-4 rotate-45" />
          Pin to Right
        </DropdownMenuItem>
        {isPinned && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onPin(column.id, false)}>
              <IconX className="mr-2 size-4" />
              Unpin
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Hook for managing column pinning
 */
export function useColumnPinning(storageKey?: string) {
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(() => {
    if (!storageKey || typeof window === "undefined") {
      return { left: [], right: [] }
    }

    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : { left: [], right: [] }
    } catch {
      return { left: [], right: [] }
    }
  })

  // Save to localStorage
  React.useEffect(() => {
    if (!storageKey || typeof window === "undefined") return

    try {
      localStorage.setItem(storageKey, JSON.stringify(columnPinning))
    } catch (error) {
      console.error("Failed to save column pinning:", error)
    }
  }, [columnPinning, storageKey])

  const pinColumn = React.useCallback(
    (columnId: string, position: "left" | "right" | false) => {
      setColumnPinning((prev) => {
        // Remove from both sides first
        const left = prev.left?.filter((id) => id !== columnId) || []
        const right = prev.right?.filter((id) => id !== columnId) || []

        // Add to specified side
        if (position === "left") {
          return { left: [...left, columnId], right }
        } else if (position === "right") {
          return { left, right: [...right, columnId] }
        } else {
          return { left, right }
        }
      })
    },
    []
  )

  const resetPinning = React.useCallback(() => {
    setColumnPinning({ left: [], right: [] })
    if (storageKey && typeof window !== "undefined") {
      localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  return {
    columnPinning,
    setColumnPinning,
    pinColumn,
    resetPinning,
  }
}

/**
 * Get pinned column styles
 */
export function getPinnedColumnStyles(
  columnId: string,
  pinningState: ColumnPinningState,
  columnIndex: number,
  columnWidths: number[]
): React.CSSProperties {
  const isPinnedLeft = pinningState.left?.includes(columnId)
  const isPinnedRight = pinningState.right?.includes(columnId)

  if (!isPinnedLeft && !isPinnedRight) {
    return {}
  }

  const baseStyles: React.CSSProperties = {
    position: "sticky",
    zIndex: 1,
    backgroundColor: "var(--background)",
  }

  if (isPinnedLeft) {
    const leftOffset = pinningState.left!
      .slice(0, pinningState.left!.indexOf(columnId))
      .reduce((sum, id, idx) => sum + (columnWidths[idx] || 150), 0)

    return {
      ...baseStyles,
      left: leftOffset,
      boxShadow: "var(--panel-shadow-left)",
    }
  }

  if (isPinnedRight) {
    const rightOffset = pinningState.right!
      .slice(pinningState.right!.indexOf(columnId) + 1)
      .reduce((sum, _, idx) => sum + (columnWidths[columnWidths.length - 1 - idx] || 150), 0)

    return {
      ...baseStyles,
      right: rightOffset,
      boxShadow: "var(--panel-shadow-right)",
    }
  }

  return {}
}
