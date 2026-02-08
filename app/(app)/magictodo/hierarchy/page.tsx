"use client"

import * as React from "react"
import { useEffect, useMemo, useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  GitBranch,
  Settings2,
  RefreshCw,
  Plus,
  Filter,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@afenda/shared/utils"
import { Button } from "@afenda/shadcn"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuCheckboxItem,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuLabel,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import { Separator } from "@afenda/shadcn"
import { ScrollArea } from "@afenda/shadcn"

import {
  TaskTreeView,
  TaskBreadcrumb,
  useHierarchyExpansion,
  useHierarchyNavigation,
  useHierarchySelection,
  useHierarchyPreferences,
  type TreeNode,
  buildTree,
  type TaskResponse,
} from "@afenda/magictodo"
import { routes } from "@afenda/shared/constants"

// ============ Page Component ============
export default function HierarchyPage() {
  const router = useRouter()
  const _searchParams = useSearchParams()

  // Store hooks
  const {
    expandedIds,
    toggle,
    expandAll,
    collapseAll,
  } = useHierarchyExpansion()

  const {
    currentRootId,
    breadcrumbs,
    drillDown,
    navigateToBreadcrumb,
    clearNavigation,
  } = useHierarchyNavigation()

  const { selectedId, select } = useHierarchySelection()

  const {
    showCompleted,
    autoExpand,
    setMaxDepth,
    setShowCompleted,
    setAutoExpand,
  } = useHierarchyPreferences()

  // Local state
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentTenantCode, _setCurrentTenantCode] = useState<string | undefined>()

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set("limit", "500")
      if (!showCompleted) {
        params.set("status", "todo,in_progress")
      }
      if (currentRootId) {
        params.set("parentId", currentRootId)
      }

      const response = await fetch(
        `${routes.api.magictodo.bff.tasks()}?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch tasks")

      const data = await response.json()
      setTasks(data.data?.items ?? data.items ?? [])
    } catch (_error) {
      toast.error("Failed to load tasks");
    }
  }, [currentRootId, showCompleted])

  // Initial load
  useEffect(() => {
    setIsLoading(true)
    fetchTasks().finally(() => setIsLoading(false))
  }, [fetchTasks])

  // Build tree from flat tasks
  const treeNodes = useMemo(() => {
    // Filter to get only tasks at current level or below current root
    let filteredTasks = tasks

    if (currentRootId) {
      // Get children of current root
      filteredTasks = tasks.filter(t => t.parentTaskId === currentRootId)
    } else {
      // Get root tasks (no parent)
      filteredTasks = tasks.filter(t => !t.parentTaskId)
    }

    // Build tree structure
    const tree = buildTree(filteredTasks as (TaskResponse & { parentTaskId?: string })[])

    return tree as TreeNode[]
  }, [tasks, currentRootId])

  // Auto-expand first level when tree loads (separate from useMemo to avoid infinite loop)
  const hasAutoExpanded = React.useRef(false)
  useEffect(() => {
    if (autoExpand && treeNodes.length > 0 && !hasAutoExpanded.current) {
      hasAutoExpanded.current = true
      const idsToExpand = treeNodes.map(n => n.id)
      expandAll(idsToExpand)
    }
  }, [autoExpand, treeNodes, expandAll])

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchTasks()
    setIsRefreshing(false)
    toast.success("Tasks refreshed")
  }, [fetchTasks])

  const handleToggle = useCallback((id: string) => {
    toggle(id)
  }, [toggle])

  const handleSelect = useCallback((id: string) => {
    select(id)
    // Navigate to task details
    router.push(`${routes.ui.magictodo.tasks()}?id=${id}`)
  }, [select, router])

  const _handleDrillDown = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id)
    if (task) {
      drillDown(id, {
        id,
        title: task.title,
        hierarchyCode: task.hierarchyCode,
        level: task.level ?? 0,
      })
    }
  }, [tasks, drillDown])

  const handleAddChild = useCallback((parentId: string) => {
    router.push(`${routes.ui.magictodo.tasks()}/new?parentId=${parentId}`)
  }, [router])

  const handleAddRootTask = useCallback(() => {
    router.push(`${routes.ui.magictodo.tasks()}/new`)
  }, [router])

  const handleExpandAll = useCallback(() => {
    const allIds = tasks.map(t => t.id)
    expandAll(allIds)
  }, [tasks, expandAll])

  const handleCollapseAll = useCallback(() => {
    collapseAll()
  }, [collapseAll])

  const handleBreadcrumbNavigate = useCallback((id: string) => {
    navigateToBreadcrumb(id)
  }, [navigateToBreadcrumb])

  const handleHomeClick = useCallback(() => {
    clearNavigation()
  }, [clearNavigation])

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length
    const rootCount = tasks.filter(t => !t.parentTaskId).length
    const withChildren = tasks.filter(t =>
      tasks.some(child => child.parentTaskId === t.id)
    ).length
    const maxLevel = Math.max(0, ...tasks.map(t => t.level ?? 0))

    return { total, rootCount, withChildren, maxLevel }
  }, [tasks])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold">Task Hierarchy</h1>
            <p className="text-sm text-muted-foreground">
              {stats.total} tasks • {stats.rootCount} root • {stats.maxLevel} levels deep
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Task */}
          <Button size="sm" onClick={handleAddRootTask}>
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>

          {/* Settings */}
          <ClientDropdownMenu>
            <ClientDropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </ClientDropdownMenuTrigger>
            <ClientDropdownMenuContent align="end" className="w-56">
              <ClientDropdownMenuLabel>View Options</ClientDropdownMenuLabel>
              <ClientDropdownMenuSeparator />

              <ClientDropdownMenuCheckboxItem
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              >
                Show completed tasks
              </ClientDropdownMenuCheckboxItem>

              <ClientDropdownMenuCheckboxItem
                checked={autoExpand}
                onCheckedChange={setAutoExpand}
              >
                Auto-expand first level
              </ClientDropdownMenuCheckboxItem>

              <ClientDropdownMenuSeparator />
              <ClientDropdownMenuLabel>Actions</ClientDropdownMenuLabel>

              <ClientDropdownMenuItem onClick={handleExpandAll}>
                Expand all
              </ClientDropdownMenuItem>
              <ClientDropdownMenuItem onClick={handleCollapseAll}>
                Collapse all
              </ClientDropdownMenuItem>
            </ClientDropdownMenuContent>
          </ClientDropdownMenu>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <TaskBreadcrumb
            items={breadcrumbs}
            currentTenantCode={currentTenantCode}
            onNavigate={handleBreadcrumbNavigate}
            onHomeClick={handleHomeClick}
            showCodes
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {currentRootId ? "Subtasks" : "All Tasks"}
                    </CardTitle>
                    <CardDescription>
                      {currentRootId
                        ? `Viewing children of ${breadcrumbs[breadcrumbs.length - 1]?.title ?? "selected task"}`
                        : "Hierarchical view of all tasks"}
                    </CardDescription>
                  </div>

                  {/* Quick filters */}
                  <ClientDropdownMenu>
                    <ClientDropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-1" />
                        Filter
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </ClientDropdownMenuTrigger>
                    <ClientDropdownMenuContent align="end">
                      <ClientDropdownMenuItem onClick={() => setMaxDepth(1)}>
                        Show 1 level
                      </ClientDropdownMenuItem>
                      <ClientDropdownMenuItem onClick={() => setMaxDepth(2)}>
                        Show 2 levels
                      </ClientDropdownMenuItem>
                      <ClientDropdownMenuItem onClick={() => setMaxDepth(3)}>
                        Show 3 levels
                      </ClientDropdownMenuItem>
                      <ClientDropdownMenuItem onClick={() => setMaxDepth(10)}>
                        Show all levels
                      </ClientDropdownMenuItem>
                    </ClientDropdownMenuContent>
                  </ClientDropdownMenu>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-4">
                <TaskTreeView
                  nodes={treeNodes}
                  expandedIds={expandedIds}
                  currentTenantCode={currentTenantCode}
                  selectedId={selectedId ?? undefined}
                  isLoading={isLoading}
                  onToggle={handleToggle}
                  onSelect={handleSelect}
                  onAddChild={handleAddChild}
                  onExpandAll={handleExpandAll}
                  onCollapseAll={handleCollapseAll}
                  emptyMessage={
                    currentRootId
                      ? "No subtasks found. Add a subtask to get started."
                      : "No tasks found. Create your first task!"
                  }
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
