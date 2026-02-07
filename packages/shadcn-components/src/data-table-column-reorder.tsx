"use client"

/**
 * Column Reordering for DataTable
 * Drag-and-drop column reordering with @dnd-kit
 */

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconGripVertical } from "@tabler/icons-react"
import { type Column } from "@tanstack/react-table"

export interface ColumnReorderProps<TData> {
  columns: Column<TData, unknown>[]
  onReorder: (columnOrder: string[]) => void
  children: React.ReactNode
}

/**
 * Sortable Column Header
 */
export function SortableColumnHeader({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <th ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-2">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          {...listeners}
          aria-label="Drag to reorder column"
        >
          <IconGripVertical className="size-4 text-muted-foreground" />
        </button>
        {children}
      </div>
    </th>
  )
}

/**
 * Column Reorder Context
 */
export function ColumnReorderContext<TData>({
  columns,
  onReorder,
  children,
}: ColumnReorderProps<TData>) {
  const columnIds = columns.map((col) => col.id)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = columnIds.indexOf(active.id as string)
        const newIndex = columnIds.indexOf(over.id as string)
        const newOrder = arrayMove(columnIds, oldIndex, newIndex)
        onReorder(newOrder)
      }
    },
    [columnIds, onReorder]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={columnIds}
        strategy={horizontalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  )
}

/**
 * Hook for managing column order
 */
export function useColumnOrder(initialOrder: string[], storageKey?: string) {
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => {
    if (!storageKey || typeof window === "undefined") return initialOrder
    
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : initialOrder
    } catch {
      return initialOrder
    }
  })

  // Save to localStorage
  React.useEffect(() => {
    if (!storageKey || typeof window === "undefined") return
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnOrder))
    } catch (error) {
      console.error("Failed to save column order:", error)
    }
  }, [columnOrder, storageKey])

  const resetOrder = React.useCallback(() => {
    setColumnOrder(initialOrder)
    if (storageKey && typeof window !== "undefined") {
      localStorage.removeItem(storageKey)
    }
  }, [initialOrder, storageKey])

  return {
    columnOrder,
    setColumnOrder,
    resetOrder,
  }
}
