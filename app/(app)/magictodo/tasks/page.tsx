/**
 * @domain magictodo
 * @layer ui
 * @responsibility UI route entrypoint for /app/tasks
 */

"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"

import { parseNaturalLanguage } from "@afenda/magictodo/hooks"
import { Button } from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Alert, AlertDescription } from "@afenda/shadcn"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@afenda/shadcn"
import { ItemGroup } from "@afenda/shadcn"
import { Spinner } from "@afenda/shadcn"
import { Tabs, TabsList, TabsTrigger } from "@afenda/shadcn"
import { ClientSelect, ClientSelectContent, ClientSelectItem, ClientSelectTrigger, ClientSelectValue } from "@afenda/shadcn"
import { AlertCircle, Calendar, Tag, Folder } from "lucide-react"
import { useUser } from "@/app/_components/user-context"
import {
  useTasksQuery,
  useProjectsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMagictodoNavigation,
  useSnoozeTaskMutation,
  useUnsnoozeTaskMutation,
  TaskListItem,
  SmartFiltersPanel,
  useSmartFilterCounts,
  applySmartFilter,
  MagicInsightsPanel,
  type TaskResponse,
  type SmartFilterType,
} from "@afenda/magictodo"
import { useTaskIndicators } from "@afenda/magictodo/hooks"
import { TenantScopeBadge } from "../_components"

export default function TasksPage() {
  const { user, isLoading, isAuthenticated } = useUser()

  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useTasksQuery()
  const { data: projectsData, isLoading: projectsLoading } = useProjectsQuery()
  const createTaskMutation = useCreateTaskMutation()
  const updateTaskMutation = useUpdateTaskMutation()
  const deleteTaskMutation = useDeleteTaskMutation()

  const tasks = useMemo(() => tasksData?.items ?? [], [tasksData?.items])
  const projects = useMemo(() => projectsData?.items ?? [], [projectsData?.items])
  const loading = tasksLoading || projectsLoading
  const error = tasksError ? String(tasksError) : null

  const { goToDetail } = useMagictodoNavigation()

  const [quickAddInput, setQuickAddInput] = useState("")
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all")
  const [smartFilter, setSmartFilter] = useState<SmartFilterType>("all")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Snooze mutations
  const snoozeMutation = useSnoozeTaskMutation()
  const unsnoozeMutation = useUnsnoozeTaskMutation()

  // Parse input for preview
  const parsedInput = quickAddInput.trim() ? parseNaturalLanguage(quickAddInput) : null

  // Memoize userId to avoid hooks depending on conditional auth
  const userId = user?.id ?? null

  // Track client mount for hydration safety (intentional one-off sync)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
    setIsMounted(true)
  }, [])  // Focus quick-add input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handlers - define all callbacks BEFORE conditional returns
  const handleQuickAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAddInput.trim() || !userId) return

    await createTaskMutation.mutateAsync({ title: quickAddInput.trim() })
    setQuickAddInput("")
    inputRef.current?.focus()
  }, [quickAddInput, userId, createTaskMutation])

  const handleInputChange = useCallback((value: string) => {
    setQuickAddInput(value)
    setShowPreview(value.trim().length > 0)
  }, [])

  const handleToggleDone = useCallback(async (taskId: string, currentStatus: string) => {
    if (!userId) return
    const newStatus = currentStatus === "done" ? "todo" : "done"
    await updateTaskMutation.mutateAsync({ id: taskId, data: { status: newStatus } })
  }, [userId, updateTaskMutation])

  const handleDelete = useCallback(async (taskId: string) => {
    if (!userId) return
    await deleteTaskMutation.mutateAsync(taskId)
  }, [userId, deleteTaskMutation])

  const handleTaskClick = useCallback(
    (task: TaskResponse) => goToDetail(task.id),
    [goToDetail]
  )

  // Snooze handlers
  const handleSnooze = useCallback(async (taskId: string, preset: string) => {
    await snoozeMutation.mutateAsync({ taskId, type: "relative", preset })
  }, [snoozeMutation])

  const handleUnsnooze = useCallback(async (taskId: string) => {
    await unsnoozeMutation.mutateAsync({ taskId })
  }, [unsnoozeMutation])

  // Filter tasks based on current filter
  const statusFilteredTasks = useMemo(() =>
    filter === "all"
      ? tasks
      : tasks.filter((t) => t.status === (filter === "done" ? "done" : "todo")),
    [filter, tasks]
  )

  // Memoize task IDs for indicator fetching (all tasks for counts)
  const allTaskIds = useMemo(() => tasks.map((t) => t.id), [tasks])
  
  // Fetch indicators for all tasks (needed for smart filter counts)
  const { indicatorsMap, isLoading: _indicatorsLoading } = useTaskIndicators(allTaskIds, {
    enabled: allTaskIds.length > 0 && !loading,
  })

  // Compute smart filter counts
  const smartFilterCounts = useSmartFilterCounts(tasks, indicatorsMap)

  // Apply smart filter to status-filtered tasks
  const filteredTasks = useMemo(() => 
    applySmartFilter(statusFilteredTasks, smartFilter, indicatorsMap),
    [statusFilteredTasks, smartFilter, indicatorsMap]
  )

  // Compute existing task stats for Magic Insights
  const existingTaskStats = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000)
    const parsedDueDate = parsedInput?.dueDate ? new Date(parsedInput.dueDate) : null

    let dueSameDay = 0
    let dueThisWeek = 0
    let urgentCount = 0
    let overdueCount = 0

    for (const task of tasks) {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null
      
      // Due same day as new task (if new task has due date)
      if (parsedDueDate && dueDate) {
        const sameDay = 
          dueDate.getFullYear() === parsedDueDate.getFullYear() &&
          dueDate.getMonth() === parsedDueDate.getMonth() &&
          dueDate.getDate() === parsedDueDate.getDate()
        if (sameDay && task.status !== "done") dueSameDay++
      }

      // Due this week
      if (dueDate && dueDate >= startOfDay && dueDate < endOfWeek && task.status !== "done") {
        dueThisWeek++
      }

      // Urgent
      if (task.priority === "urgent" && task.status !== "done") urgentCount++

      // Overdue
      if (dueDate && dueDate < now && task.status !== "done") overdueCount++
    }

    return { dueSameDay, dueThisWeek, urgentCount, overdueCount }
  }, [tasks, parsedInput])

  // Task data for Magic Insights (from NL parser preview)
  const insightTaskData = useMemo(() => ({
    title: parsedInput?.title || quickAddInput,
    dueDate: parsedInput?.dueDate ? new Date(parsedInput.dueDate) : null,
    priority: parsedInput?.priority as "low" | "medium" | "high" | "urgent" | undefined,
    tags: parsedInput?.tags,
  }), [parsedInput, quickAddInput])

  // ============ CONDITIONAL RETURNS (all hooks must be called before this point) ============

  // Prevent hydration mismatch by rendering consistent skeleton on server and initial client render
  if (!isMounted) {
    return (
      <div className="space-y-4" suppressHydrationWarning>
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-64 w-full animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Loading authentication...</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAuthenticated || !userId) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Not authenticated. Please log in.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Minimal, keyboard-first task management.
          </p>
        </div>
        <TenantScopeBadge className="mt-1" />
      </div>

      <Card>
        <CardHeader className="border-b px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-lg">Quick add</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Add a task... (e.g., 'tomorrow 9am call with Bob')"
              value={quickAddInput}
              onChange={(e) => handleInputChange(e.target.value)}
              className="flex-1 text-base sm:text-sm"
            />

            {/* NL Parser Preview */}
            {showPreview && parsedInput && (
              <div className="rounded-md border bg-muted/30 p-3 text-xs sm:text-sm">
                <div className="font-medium text-muted-foreground mb-2">Preview:</div>
                <div className="space-y-1">
                  <div><strong>Title:</strong> {parsedInput.title}</div>
                  {parsedInput.dueDate && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <strong>Due:</strong> {new Date(parsedInput.dueDate).toLocaleDateString()} {new Date(parsedInput.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {parsedInput.priority && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong>Priority:</strong> <Badge variant="outline">{parsedInput.priority}</Badge>
                    </div>
                  )}
                  {parsedInput.tags && parsedInput.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="h-3 w-3 shrink-0" />
                      <strong>Tags:</strong> <div className="flex gap-1 flex-wrap">{parsedInput.tags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Magic Insights - show only when typing and there's content */}
            {showPreview && quickAddInput.trim().length > 3 && (
              <MagicInsightsPanel
                task={insightTaskData}
                existingTasks={existingTaskStats}
                compact
                maxInsights={3}
                filterTypes={["warning", "suggestion"]}
              />
            )}

            <Button type="submit" disabled={!quickAddInput.trim() || createTaskMutation.isPending} className="w-full sm:w-auto" size="lg">
              {createTaskMutation.isPending ? <Spinner className="mr-1.5" /> : null}
              Add Task
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Project Filter */}
      {projects.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Project:</span>
          </div>
          <ClientSelect value={selectedProject || ""} onValueChange={(value) => setSelectedProject(value || null)}>
            <ClientSelectTrigger className="w-48">
              <ClientSelectValue placeholder="All projects" />
            </ClientSelectTrigger>
            <ClientSelectContent>
              <ClientSelectItem value="">All projects</ClientSelectItem>
              {projects.map((project) => (
                <ClientSelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: project.color ?? "var(--primary)" }}
                    />
                    {project.name}
                  </div>
                </ClientSelectItem>
              ))}
            </ClientSelectContent>
          </ClientSelect>
        </div>
      )}

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as typeof filter)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="todo">To do</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Smart Filters */}
      <SmartFiltersPanel
        activeFilter={smartFilter}
        onFilterChange={setSmartFilter}
        counts={smartFilterCounts}
        compact
      />

      <Card>
        <CardHeader className="border-b px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-lg">Task list</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Spinner className="size-4" />
              Loading tasks…
            </div>
          ) : filteredTasks.length === 0 ? (
            <Empty className="p-6 sm:p-10">
              <EmptyHeader>
                <EmptyTitle className="text-lg sm:text-xl">
                  {filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
                </EmptyTitle>
                <EmptyDescription className="text-sm">
                  {filter === "all"
                    ? "Add your first task above."
                    : "Switch filters to see other tasks."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-2">
              {filteredTasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  indicators={indicatorsMap.get(task.id)}
                  onToggleDone={handleToggleDone}
                  onDelete={handleDelete}
                  onClick={handleTaskClick}
                  onSnooze={handleSnooze}
                  onUnsnooze={handleUnsnooze}
                />
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t text-xs sm:text-sm text-muted-foreground">
          <div className="text-center">
            <span className="font-medium text-foreground text-sm sm:text-base block">
              {tasks.filter((t) => t.status === "todo").length}
            </span>
            to do
          </div>
          <div className="text-center">
            <span className="font-medium text-foreground text-sm sm:text-base block">
              {tasks.filter((t) => t.status === "in_progress").length}
            </span>
            in progress
          </div>
          <div className="text-center">
            <span className="font-medium text-foreground text-sm sm:text-base block">
              {tasks.filter((t) => t.status === "done").length}
            </span>
            done
          </div>
        </div>
      )}
    </div>
  )
}

