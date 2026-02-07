/**
 * DependencyList Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Display and manage task dependencies
 */

"use client"

import { useState, useCallback } from "react"
import { Button, Badge, Input, ClientSelect, ClientSelectContent, ClientSelectItem, ClientSelectTrigger, ClientSelectValue } from "@afenda/shadcn"
import { cn } from "@afenda/shared/utils"
import { Plus, Trash2, Loader2, ArrowRight, Link2, Copy, AlertCircle } from "lucide-react"
import type { TaskDependency, DependencyType } from "@afenda/magictodo/zod"
import { DEPENDENCY_TYPE } from "@afenda/magictodo/zod"

export interface TaskReference {
  id: string
  title: string
  status?: string
}

export interface DependencyListProps {
  taskId: string
  dependencies: (TaskDependency & { dependsOnTask?: TaskReference })[]
  dependents?: (TaskDependency & { task?: TaskReference })[]
  availableTasks?: TaskReference[]
  isLoading?: boolean
  isBlocked?: boolean
  onAddDependency?: (dependsOnTaskId: string, type: DependencyType) => Promise<void>
  onRemoveDependency?: (dependencyId: string) => Promise<void>
  onNavigateToTask?: (taskId: string) => void
  readonly?: boolean
}

const dependencyTypeLabels: Record<DependencyType, { label: string; icon: React.ReactNode; color: string }> = {
  [DEPENDENCY_TYPE.BLOCKS]: {
    label: "Blocks",
    icon: <AlertCircle className="h-3 w-3" />,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  [DEPENDENCY_TYPE.RELATES_TO]: {
    label: "Related",
    icon: <Link2 className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  [DEPENDENCY_TYPE.DUPLICATES]: {
    label: "Duplicate",
    icon: <Copy className="h-3 w-3" />,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
}

export function DependencyList({
  taskId: _taskId,
  dependencies,
  dependents = [],
  availableTasks = [],
  isLoading = false,
  isBlocked = false,
  onAddDependency,
  onRemoveDependency,
  onNavigateToTask,
  readonly = false,
}: DependencyListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [selectedType, setSelectedType] = useState<DependencyType>(DEPENDENCY_TYPE.BLOCKS)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTasks = availableTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !dependencies.some((d) => d.dependsOnTaskId === task.id)
  )

  const handleAddDependency = useCallback(async () => {
    if (!selectedTaskId || !onAddDependency) return

    setIsAdding(true)
    try {
      await onAddDependency(selectedTaskId, selectedType)
      setSelectedTaskId("")
      setSearchQuery("")
    } finally {
      setIsAdding(false)
    }
  }, [selectedTaskId, selectedType, onAddDependency])

  const handleRemoveDependency = useCallback(
    async (dependencyId: string) => {
      if (!onRemoveDependency) return
      await onRemoveDependency(dependencyId)
    },
    [onRemoveDependency]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading dependencies...</span>
      </div>
    )
  }

  const hasDependencies = dependencies.length > 0 || dependents.length > 0

  return (
    <div className="space-y-4">
      {/* Blocked warning */}
      {isBlocked && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>This task is blocked by incomplete dependencies</span>
        </div>
      )}

      {/* Dependencies this task has (blocks this task) */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Depends On ({dependencies.length})
          </h4>
          <ul className="space-y-1">
            {dependencies.map((dep) => (
              <li
                key={dep.id}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    "flex items-center gap-1 text-xs px-1.5",
                    dependencyTypeLabels[dep.type].color
                  )}
                >
                  {dependencyTypeLabels[dep.type].icon}
                  {dependencyTypeLabels[dep.type].label}
                </Badge>
                <button
                  type="button"
                  onClick={() => onNavigateToTask?.(dep.dependsOnTaskId)}
                  className="flex-1 truncate text-left text-sm hover:underline"
                >
                  {dep.dependsOnTask?.title ?? dep.dependsOnTaskId}
                </button>
                {dep.dependsOnTask?.status && (
                  <span className="text-xs text-muted-foreground">{dep.dependsOnTask.status}</span>
                )}
                {!readonly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveDependency(dep.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    <span className="sr-only">Remove dependency</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dependents (tasks that depend on this task) */}
      {dependents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Blocking ({dependents.length})
          </h4>
          <ul className="space-y-1">
            {dependents.map((dep) => (
              <li
                key={dep.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => onNavigateToTask?.(dep.taskId)}
                  className="flex-1 truncate text-left text-sm hover:underline"
                >
                  {dep.task?.title ?? dep.taskId}
                </button>
                {dep.task?.status && (
                  <span className="text-xs text-muted-foreground">{dep.task.status}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {!hasDependencies && !readonly && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No dependencies. Add one to track task relationships.
        </p>
      )}

      {/* Add dependency form */}
      {!readonly && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
            <ClientSelect value={selectedType} onValueChange={(v) => setSelectedType(v as DependencyType)}>
              <ClientSelectTrigger className="w-28 h-8">
                <ClientSelectValue />
              </ClientSelectTrigger>
              <ClientSelectContent>
                <ClientSelectItem value={DEPENDENCY_TYPE.BLOCKS}>Blocks</ClientSelectItem>
                <ClientSelectItem value={DEPENDENCY_TYPE.RELATES_TO}>Related</ClientSelectItem>
                <ClientSelectItem value={DEPENDENCY_TYPE.DUPLICATES}>Duplicate</ClientSelectItem>
              </ClientSelectContent>
            </ClientSelect>
          </div>

          {searchQuery && filteredTasks.length > 0 && (
            <ul className="max-h-32 overflow-y-auto space-y-1 rounded-md border bg-popover p-1">
              {filteredTasks.slice(0, 10).map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskId(task.id)
                      setSearchQuery(task.title)
                    }}
                    className={cn(
                      "w-full text-left px-2 py-1 text-sm rounded hover:bg-muted truncate",
                      selectedTaskId === task.id && "bg-muted"
                    )}
                  >
                    {task.title}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full h-8"
            onClick={handleAddDependency}
            disabled={!selectedTaskId || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-1 h-3 w-3" />
                Add Dependency
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
