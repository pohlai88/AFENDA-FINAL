/**
 * @domain magictodo
 * @layer ui
 * @responsibility Kanban board content (lazy-loaded by page.tsx)
 * Drag-and-drop task management
 */

"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useUser } from "@/app/_components/user-context"
import { Alert, AlertDescription } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn"
import { AlertCircle, Plus, LoaderCircle } from "lucide-react"
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
  type DragEndEvent,
} from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import {
  useTasksQuery,
  useUpdateTaskMutation,
  useKanbanStore,
  columnIdToStatus,
  type TaskResponse,
  type KanbanGroupBy,
} from "@afenda/magictodo"

// Map tasks to kanban format
interface KanbanTaskItem {
  id: string
  name: string
  column: string
  priority?: string
  dueDate?: string
  tags?: string[]
  task: TaskResponse
  [key: string]: unknown
}

function taskToKanbanItem(task: TaskResponse): KanbanTaskItem {
  // Map task status to column
  const column = task.status === "in_progress" ? "in_progress" 
    : task.status === "done" ? "done" 
    : task.status === "cancelled" ? "cancelled"
    : "todo"
  
  return {
    id: task.id,
    name: task.title,
    column,
    priority: task.priority,
    dueDate: task.dueDate,
    tags: task.tags,
    task,
  }
}

const KANBAN_COLUMNS = [
  { id: "todo", name: "To Do" },
  { id: "in_progress", name: "In Progress" },
  { id: "done", name: "Done" },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
}

export default function KanbanPage() {
  const { user, isLoading, isAuthenticated } = useUser()
  const [mounted, setMounted] = useState(false)

  // Prevent SSR to avoid dnd-kit hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Kanban store for UI state
  const { groupBy, setGroupBy } = useKanbanStore()

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading, error } = useTasksQuery(
    { sortBy: "dueDate", sortOrder: "asc" },
    { enabled: !!user?.id }
  )

  const updateTaskMutation = useUpdateTaskMutation()

  // Convert tasks to kanban items
  const kanbanItems = useMemo(() => {
    if (!tasksData?.items) return []
    return tasksData.items.map(taskToKanbanItem)
  }, [tasksData?.items])

  // Local state for optimistic updates
  const [localItems, setLocalItems] = useState<KanbanTaskItem[]>([])

  // Sync with fetched data
  useEffect(() => {
    setLocalItems(kanbanItems)
  }, [kanbanItems])

  // Handle drag end - update task status
  const handleDataChange = useCallback((newData: KanbanTaskItem[]) => {
    setLocalItems(newData)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const draggedItem = localItems.find((item) => item.id === active.id)
    if (!draggedItem) return

    // Check if column changed
    const newColumnId = over.id as string
    const isColumn = KANBAN_COLUMNS.some((col) => col.id === newColumnId)
    
    if (isColumn && draggedItem.column !== newColumnId) {
      const newStatus = columnIdToStatus(newColumnId)
      try {
        await updateTaskMutation.mutateAsync({
          id: draggedItem.id,
          data: { status: newStatus as "todo" | "in_progress" | "done" | "cancelled" },
        })
      } catch (_err) {
        // Revert on error
        setLocalItems(kanbanItems)
      }
    }
  }, [localItems, updateTaskMutation, kanbanItems])

  // Column task counts
  const columnCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    KANBAN_COLUMNS.forEach((col) => {
      counts[col.id] = localItems.filter((item) => item.column === col.id).length
    })
    return counts
  }, [localItems])

  // ============ CONDITIONAL RETURNS (all hooks must be called before this point) ============
  
  // Hydration-safe loading skeleton - renders same on server and client
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    )
  }

  // Auth states
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please sign in to view the Kanban board.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAuthenticated || !user?.id) {
    return (
      <div className="space-y-4 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Not authenticated. Please log in.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load tasks. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <p className="text-muted-foreground">
            Drag and drop tasks to update their status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ClientSelect value={groupBy} onValueChange={(v) => setGroupBy((v ?? "status") as KanbanGroupBy)}>
            <ClientSelectTrigger className="w-[150px]">
              <ClientSelectValue placeholder="Group by" />
            </ClientSelectTrigger>
            <ClientSelectContent>
              <ClientSelectItem value="status">Status</ClientSelectItem>
              <ClientSelectItem value="priority">Priority</ClientSelectItem>
              <ClientSelectItem value="project">Project</ClientSelectItem>
            </ClientSelectContent>
          </ClientSelect>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-hidden">
        <KanbanProvider
          columns={KANBAN_COLUMNS}
          data={localItems}
          onDataChange={handleDataChange}
          onDragEnd={handleDragEnd}
          className="h-full"
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id} className="h-full">
              <KanbanHeader className="flex items-center justify-between">
                <span>{column.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {columnCounts[column.id] ?? 0}
                </Badge>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(item: KanbanTaskItem) => (
                  <KanbanCard key={item.id} {...item}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm leading-tight">
                          {item.name}
                        </span>
                        {item.priority && (
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[item.priority] ?? "bg-gray-400"}`}
                            title={item.priority}
                          />
                        )}
                      </div>
                      {(item.dueDate || (item.tags && item.tags.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-1">
                          {item.dueDate && (
                            <Badge variant="outline" className="text-xs">
                              {new Date(item.dueDate).toLocaleDateString()}
                            </Badge>
                          )}
                          {item.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags && item.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  )
}
