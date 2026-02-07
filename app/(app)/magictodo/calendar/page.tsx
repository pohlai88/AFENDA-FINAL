/**
 * @domain magictodo
 * @layer ui
 * @responsibility UI route entrypoint for /app/magictodo/calendar
 * Calendar view showing tasks by due date with month/week/day views
 */

"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useUser } from "@/app/_components/user-context"
import { Alert, AlertDescription } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Tabs, TabsList, TabsTrigger } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  CalendarDays,
  CalendarIcon,
  Plus,
  CheckCircle2,
  Circle,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"
import {
  useTasksQuery,
  useUpdateTaskMutation,
  type TaskResponse,
} from "@afenda/magictodo"

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-blue-500",
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]!
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Add padding days from previous month
  const startPadding = firstDay.getDay()
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }
  
  // Add days of current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  
  // Add padding days from next month
  const endPadding = 6 - lastDay.getDay()
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i))
  }
  
  return days
}

function getWeekDays(date: Date): Date[] {
  const days: Date[] = []
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    days.push(day)
  }
  
  return days
}

interface TaskItemProps {
  task: TaskResponse
  compact?: boolean
  onToggle?: (taskId: string) => void
}

function TaskItem({ task, compact, onToggle }: TaskItemProps) {
  const isDone = task.status === "done"
  
  return (
    <div
      className={cn(
        "flex items-start gap-2 p-2 rounded-md border-l-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer",
        PRIORITY_COLORS[task.priority ?? "medium"] ?? "border-l-gray-400",
        isDone && "opacity-60"
      )}
      onClick={() => onToggle?.(task.id)}
    >
      {isDone ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isDone && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        {!compact && task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  // ============ ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ============
  
  // State for hydration-safe mounting
  const [mounted, setMounted] = useState(false)
  
  const { user, isLoading, isAuthenticated } = useUser()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<"month" | "week">("month")

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading, error } = useTasksQuery(
    { sortBy: "dueDate", sortOrder: "asc" },
    { enabled: !!user?.id }
  )

  const updateTaskMutation = useUpdateTaskMutation()

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskResponse[]>()
    if (!tasksData?.items) return map
    
    for (const task of tasksData.items) {
      if (task.dueDate) {
        const dateKey = task.dueDate.split("T")[0]!
        const existing = map.get(dateKey) ?? []
        map.set(dateKey, [...existing, task])
      }
    }
    
    return map
  }, [tasksData])

  // Get days for current view
  const viewDays = useMemo(() => {
    if (view === "month") {
      return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())
    }
    return getWeekDays(currentDate)
  }, [currentDate, view])

  // Navigation
  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (view === "month") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setDate(prev.getDate() - 7)
      }
      return newDate
    })
  }, [view])

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (view === "month") {
        newDate.setMonth(prev.getMonth() + 1)
      } else {
        newDate.setDate(prev.getDate() + 7)
      }
      return newDate
    })
  }, [view])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }, [])

  // Toggle task completion
  const handleToggleTask = useCallback(async (taskId: string) => {
    const task = tasksData?.items.find((t) => t.id === taskId)
    if (!task) return
    
    const newStatus = task.status === "done" ? "todo" : "done"
    await updateTaskMutation.mutateAsync({
      id: taskId,
      data: { status: newStatus },
    })
  }, [tasksData?.items, updateTaskMutation])

  // Selected date tasks
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = formatDate(selectedDate)
    return tasksByDate.get(dateKey) ?? []
  }, [selectedDate, tasksByDate])

  // Set mounted state after hydration (intentional one-off sync)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
    setMounted(true)
  }, [])

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
          <AlertDescription>Please sign in to view the calendar.</AlertDescription>
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

  const today = formatDate(new Date())
  const currentMonth = currentDate.getMonth()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={goToToday}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
            <TabsList>
              <TabsTrigger value="month" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                Month
              </TabsTrigger>
              <TabsTrigger value="week" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Calendar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className={cn(
            "flex-1 grid grid-cols-7 overflow-y-auto",
            view === "month" ? "auto-rows-fr" : "grid-rows-1"
          )}>
            {viewDays.map((day) => {
              const dateKey = formatDate(day)
              const tasks = tasksByDate.get(dateKey) ?? []
              const isToday = dateKey === today
              const isSelected = selectedDate && formatDate(selectedDate) === dateKey
              const isCurrentMonth = day.getMonth() === currentMonth

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "border-r border-b p-1 min-h-[100px] cursor-pointer transition-colors",
                    !isCurrentMonth && view === "month" && "bg-muted/30",
                    isSelected && "bg-primary/5 ring-2 ring-primary ring-inset",
                    !isSelected && "hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                        isToday && "bg-primary text-primary-foreground",
                        !isCurrentMonth && view === "month" && "text-muted-foreground"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {tasks.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {tasks.length}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {tasks.slice(0, view === "month" ? 3 : 10).map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        compact={view === "month"}
                        onToggle={handleToggleTask}
                      />
                    ))}
                    {tasks.length > 3 && view === "month" && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{tasks.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar - Selected Date Details */}
        {selectedDate && (
          <div className="w-80 border-l bg-muted/30 overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-4 space-y-2">
              {selectedDateTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tasks for this day
                </p>
              ) : (
                selectedDateTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                  />
                ))
              )}
              <Button variant="outline" className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Task for {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
