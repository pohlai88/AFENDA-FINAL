/**
 * @domain magictodo
 * @layer ui
 * @responsibility Gantt chart content (lazy-loaded by page.tsx)
 * Timeline visualization, drag-to-resize, dependency arrows,
 * critical path highlighting, resource allocation, and quarter zoom
 */

"use client"

import { useMemo, useState, useCallback, useRef, useEffect } from "react"
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
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import { Switch } from "@afenda/shadcn"
import { Label } from "@afenda/shadcn"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  CalendarDays,
  Flag,
  CheckCircle2,
  Circle,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"
import {
  useTasksQuery,
  useUpdateTaskMutation,
  type TaskResponse,
} from "@afenda/magictodo"

// ============ Types ============
type ZoomLevel = "day" | "week" | "month" | "quarter"

interface GanttTask extends TaskResponse {
  startDate: Date
  endDate: Date
  progress: number
  isMilestone: boolean
  dependencies?: string[] // Task IDs this task depends on
  assigneeId?: string | null
  assigneeName?: string | null
  isCriticalPath?: boolean
}

interface TimelineConfig {
  startDate: Date
  endDate: Date
  dayWidth: number
  totalDays: number
}

interface DependencyArrow {
  fromTaskId: string
  toTaskId: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

// ============ Constants ============
const ZOOM_CONFIGS: Record<ZoomLevel, { dayWidth: number; label: string }> = {
  day: { dayWidth: 40, label: "Day" },
  week: { dayWidth: 16, label: "Week" },
  month: { dayWidth: 6, label: "Month" },
  quarter: { dayWidth: 2, label: "Quarter" },
}

const ROW_HEIGHT = 48
const HEADER_HEIGHT = 80
const TASK_BAR_HEIGHT = 28
const LEFT_PANEL_WIDTH = 280
const RESOURCE_ROW_HEIGHT = 32

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
}

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-400",
  in_progress: "bg-blue-500",
  done: "bg-green-500",
  cancelled: "bg-red-300",
}

const CRITICAL_PATH_COLOR = "ring-2 ring-red-500 ring-offset-1"

// ============ Date Utilities ============
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function diffDays(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function startOfWeek(date: Date): Date {
  const result = startOfDay(date)
  const day = result.getDay()
  result.setDate(result.getDate() - day)
  return result
}

function startOfMonth(date: Date): Date {
  const result = startOfDay(date)
  result.setDate(1)
  return result
}

function formatDate(date: Date, format: "short" | "month" | "full" = "short"): string {
  if (format === "month") {
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
  }
  if (format === "full") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1
}

// ============ Critical Path Calculation ============
function calculateCriticalPath(tasks: GanttTask[]): Set<string> {
  const criticalTaskIds = new Set<string>()
  
  // Build dependency graph
  const taskMap = new Map<string, GanttTask>()
  const dependents = new Map<string, string[]>() // task -> tasks that depend on it
  
  tasks.forEach((task) => {
    taskMap.set(task.id, task)
    dependents.set(task.id, [])
  })
  
  tasks.forEach((task) => {
    if (task.dependencies) {
      task.dependencies.forEach((depId) => {
        const deps = dependents.get(depId)
        if (deps) deps.push(task.id)
      })
    }
  })
  
  // Find tasks with no dependents (end tasks)
  const endTasks = tasks.filter((t) => {
    const deps = dependents.get(t.id)
    return !deps || deps.length === 0
  })
  
  // Find the longest path ending at each end task
  function getLongestPathTo(taskId: string, visited: Set<string>): { length: number; path: string[] } {
    if (visited.has(taskId)) return { length: 0, path: [] }
    visited.add(taskId)
    
    const task = taskMap.get(taskId)
    if (!task) return { length: 0, path: [] }
    
    const taskDuration = diffDays(task.startDate, task.endDate)
    
    if (!task.dependencies || task.dependencies.length === 0) {
      return { length: taskDuration, path: [taskId] }
    }
    
    let longestPred = { length: 0, path: [] as string[] }
    for (const depId of task.dependencies) {
      const predPath = getLongestPathTo(depId, new Set(visited))
      if (predPath.length > longestPred.length) {
        longestPred = predPath
      }
    }
    
    return {
      length: longestPred.length + taskDuration,
      path: [...longestPred.path, taskId],
    }
  }
  
  let longestPath: string[] = []
  let maxLength = 0
  
  for (const endTask of endTasks) {
    const result = getLongestPathTo(endTask.id, new Set())
    if (result.length > maxLength) {
      maxLength = result.length
      longestPath = result.path
    }
  }
  
  longestPath.forEach((id) => criticalTaskIds.add(id))
  return criticalTaskIds
}

// ============ Dependency Arrow SVG Path ============
function calculateDependencyArrows(
  tasks: GanttTask[],
  config: TimelineConfig,
  taskIndexMap: Map<string, number>
): DependencyArrow[] {
  const arrows: DependencyArrow[] = []
  const { startDate: timelineStart, dayWidth } = config
  
  tasks.forEach((task, toIndex) => {
    if (!task.dependencies) return
    
    task.dependencies.forEach((fromId) => {
      const fromIndex = taskIndexMap.get(fromId)
      if (fromIndex === undefined) return
      
      const fromTask = tasks[fromIndex]
      if (!fromTask) return
      
      // Calculate positions
      const fromOffsetDays = diffDays(timelineStart, fromTask.endDate)
      const fromX = fromOffsetDays * dayWidth
      const fromY = fromIndex * ROW_HEIGHT + ROW_HEIGHT / 2
      
      const toOffsetDays = diffDays(timelineStart, task.startDate)
      const toX = toOffsetDays * dayWidth
      const toY = toIndex * ROW_HEIGHT + ROW_HEIGHT / 2
      
      arrows.push({
        fromTaskId: fromId,
        toTaskId: task.id,
        fromX,
        fromY,
        toX,
        toY,
      })
    })
  })
  
  return arrows
}

function DependencyArrowsSVG({
  arrows,
  showCriticalPath,
  criticalPathIds,
}: {
  arrows: DependencyArrow[]
  showCriticalPath: boolean
  criticalPathIds: Set<string>
}) {
  return (
    <svg className="absolute inset-0 pointer-events-none z-5" style={{ overflow: "visible" }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="var(--muted-foreground)" />
        </marker>
        <marker
          id="arrowhead-critical"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="var(--critical)" />
        </marker>
      </defs>
      {arrows.map((arrow, i) => {
        const isCritical = showCriticalPath && 
          criticalPathIds.has(arrow.fromTaskId) && 
          criticalPathIds.has(arrow.toTaskId)
        
        // Calculate curved path
        const midX = (arrow.fromX + arrow.toX) / 2
        const controlOffset = 20
        
        const pathD = `
          M ${arrow.fromX} ${arrow.fromY}
          C ${arrow.fromX + controlOffset} ${arrow.fromY},
            ${midX} ${arrow.fromY},
            ${midX} ${(arrow.fromY + arrow.toY) / 2}
          C ${midX} ${arrow.toY},
            ${arrow.toX - controlOffset} ${arrow.toY},
            ${arrow.toX - 8} ${arrow.toY}
        `
        
        return (
          <path
            key={i}
            d={pathD}
            fill="none"
            stroke={isCritical ? "var(--critical)" : "var(--muted-foreground)"}
            strokeWidth={isCritical ? 2 : 1.5}
            strokeDasharray={isCritical ? "none" : "4,2"}
            markerEnd={isCritical ? "url(#arrowhead-critical)" : "url(#arrowhead)"}
          />
        )
      })}
    </svg>
  )
}

// ============ Task Conversion ============
function convertToGanttTask(task: TaskResponse): GanttTask | null {
  // Need at least a due date to show on Gantt
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  if (!dueDate) return null

  const createdAt = task.createdAt ? new Date(task.createdAt) : new Date()
  // Use createdAt as start date (startDate field not yet in schema)
  const startDate = createdAt
  const endDate = dueDate

  // Calculate progress based on status
  let progress = 0
  if (task.status === "done") progress = 100
  else if (task.status === "in_progress") progress = 50

  // Milestone if start and end are same day
  const isMilestone = diffDays(startDate, endDate) <= 1

  return {
    ...task,
    startDate,
    endDate,
    progress,
    isMilestone,
  }
}

// ============ Timeline Header ============
function TimelineHeader({
  config,
  zoom,
}: {
  config: TimelineConfig
  zoom: ZoomLevel
}) {
  const { startDate, totalDays, dayWidth } = config

  // Generate date markers based on zoom level
  const markers: { date: Date; label: string; isMain: boolean; width?: number }[] = []

  if (zoom === "day") {
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i)
      const isMonday = date.getDay() === 1
      markers.push({
        date,
        label: date.getDate().toString(),
        isMain: isMonday || date.getDate() === 1,
      })
    }
  } else if (zoom === "week") {
    let current = startOfWeek(startDate)
    while (current < addDays(startDate, totalDays)) {
      markers.push({
        date: current,
        label: `W${getWeekNumber(current)}`,
        isMain: current.getDate() <= 7,
      })
      current = addDays(current, 7)
    }
  } else if (zoom === "quarter") {
    // Quarter zoom - show months grouped by quarter
    let current = startOfMonth(startDate)
    while (current < addDays(startDate, totalDays)) {
      const quarter = getQuarter(current)
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      const daysInMonth = diffDays(current, nextMonth)
      markers.push({
        date: current,
        label: `Q${quarter} ${current.toLocaleDateString("en-US", { month: "short" })}`,
        isMain: current.getMonth() % 3 === 0,
        width: daysInMonth * dayWidth,
      })
      current = nextMonth
    }
  } else {
    let current = startOfMonth(startDate)
    while (current < addDays(startDate, totalDays)) {
      markers.push({
        date: current,
        label: formatDate(current, "month"),
        isMain: true,
      })
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    }
  }

  return (
    <div className="h-20 border-b bg-muted/50">
      {/* Month/Quarter row (for day/week/quarter zoom) */}
      {(zoom === "day" || zoom === "week" || zoom === "quarter") && (
        <div className="h-8 flex border-b">
          {(() => {
            if (zoom === "quarter") {
              // Show quarters
              const quarters: { label: string; width: number }[] = []
              let current = startOfMonth(startDate)
              let currentQ = getQuarter(current)
              let currentYear = current.getFullYear()
              let qWidth = 0
              
              while (current < addDays(startDate, totalDays)) {
                const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1)
                const daysInMonth = diffDays(current, nextMonth)
                const q = getQuarter(current)
                const y = current.getFullYear()
                
                if (q === currentQ && y === currentYear) {
                  qWidth += daysInMonth * dayWidth
                } else {
                  quarters.push({ label: `Q${currentQ} ${currentYear}`, width: qWidth })
                  currentQ = q
                  currentYear = y
                  qWidth = daysInMonth * dayWidth
                }
                current = nextMonth
              }
              if (qWidth > 0) {
                quarters.push({ label: `Q${currentQ} ${currentYear}`, width: qWidth })
              }
              
              return quarters.map((q, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-xs font-medium border-r bg-muted/30"
                  style={{ width: q.width }}
                >
                  {q.label}
                </div>
              ))
            }
            
            // Regular month row for day/week zoom
            const months: { date: Date; width: number }[] = []
            let current = startOfMonth(startDate)
            while (current < addDays(startDate, totalDays)) {
              const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1)
              const monthStart = current < startDate ? startDate : current
              const monthEnd = nextMonth > addDays(startDate, totalDays) ? addDays(startDate, totalDays) : nextMonth
              const daysInView = diffDays(monthStart, monthEnd)
              months.push({ date: current, width: daysInView * dayWidth })
              current = nextMonth
            }
            return months.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-xs font-medium border-r"
                style={{ width: m.width }}
              >
                {formatDate(m.date, "month")}
              </div>
            ))
          })()}
        </div>
      )}

      {/* Day/Week/Month/Quarter markers */}
      <div className="h-12 flex">
        {markers.map((marker, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-center text-xs border-r",
              marker.isMain ? "font-medium" : "text-muted-foreground"
            )}
            style={{ 
              width: marker.width ?? (zoom === "day" ? dayWidth : zoom === "week" ? 7 * dayWidth : undefined),
              minWidth: marker.width ?? (zoom === "day" ? dayWidth : zoom === "week" ? 7 * dayWidth : undefined)
            }}
          >
            {marker.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ Gantt Bar ============
function GanttBar({
  task,
  config,
  onDragEnd,
  showCriticalPath,
  isCritical,
}: {
  task: GanttTask
  config: TimelineConfig
  onDragEnd?: (taskId: string, newStart: Date, newEnd: Date) => void
  showCriticalPath?: boolean
  isCritical?: boolean
}) {
  const { startDate: timelineStart, dayWidth } = config
  const [isDragging, _setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const originalWidthRef = useRef(0)
  const originalLeftRef = useRef(0)

  // Calculate position
  const offsetDays = diffDays(timelineStart, task.startDate)
  const durationDays = Math.max(1, diffDays(task.startDate, task.endDate))
  const baseLeft = offsetDays * dayWidth
  const baseWidth = durationDays * dayWidth

  const priorityColor = PRIORITY_COLORS[task.priority ?? "medium"] ?? PRIORITY_COLORS.medium
  const statusColor = STATUS_COLORS[task.status] ?? STATUS_COLORS.todo

  // Handle resize mouse events
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current
      const deltaDays = Math.round(deltaX / dayWidth)
      
      if (isResizing === "right") {
        const newDuration = Math.max(1, Math.round(originalWidthRef.current / dayWidth) + deltaDays)
        setDragOffset(newDuration * dayWidth - originalWidthRef.current)
      } else if (isResizing === "left") {
        const _newLeft = originalLeftRef.current + deltaX
        const newDuration = Math.round((originalWidthRef.current - deltaX) / dayWidth)
        if (newDuration >= 1) {
          setDragOffset(deltaX)
        }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current
      const deltaDays = Math.round(deltaX / dayWidth)
      
      if (onDragEnd) {
        if (isResizing === "right") {
          const newEndDate = addDays(task.endDate, deltaDays)
          if (newEndDate > task.startDate) {
            onDragEnd(task.id, task.startDate, newEndDate)
          }
        } else if (isResizing === "left") {
          const newStartDate = addDays(task.startDate, deltaDays)
          if (newStartDate < task.endDate) {
            onDragEnd(task.id, newStartDate, task.endDate)
          }
        }
      }
      
      setIsResizing(null)
      setDragOffset(0)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, dayWidth, onDragEnd, task])

  const handleResizeStart = (e: React.MouseEvent, side: "left" | "right") => {
    e.stopPropagation()
    e.preventDefault()
    startXRef.current = e.clientX
    originalWidthRef.current = baseWidth
    originalLeftRef.current = baseLeft
    setIsResizing(side)
  }

  // Milestone rendering
  if (task.isMilestone) {
    return (
      <ClientTooltipProvider>
        <ClientTooltip>
          <ClientTooltipTrigger asChild>
            <div
              className={cn(
                "absolute flex items-center cursor-pointer",
                showCriticalPath && isCritical && "drop-shadow-lg"
              )}
              style={{
                left: baseLeft + dayWidth / 2 - 8,
                top: (ROW_HEIGHT - 16) / 2,
              }}
            >
              <div className={cn(
                "w-4 h-4 rotate-45",
                priorityColor,
                showCriticalPath && isCritical && "ring-2 ring-red-500"
              )} />
            </div>
          </ClientTooltipTrigger>
          <ClientTooltipContent>
            <p className="font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground">Milestone: {formatDate(task.endDate, "full")}</p>
          </ClientTooltipContent>
        </ClientTooltip>
      </ClientTooltipProvider>
    )
  }

  // Calculate display dimensions with drag offset
  let displayLeft = baseLeft
  let displayWidth = baseWidth

  if (isResizing === "right") {
    displayWidth = baseWidth + dragOffset
  } else if (isResizing === "left") {
    displayLeft = baseLeft + dragOffset
    displayWidth = baseWidth - dragOffset
  }

  return (
    <ClientTooltipProvider>
      <ClientTooltip>
        <ClientTooltipTrigger asChild>
          <div
            ref={barRef}
            className={cn(
              "absolute rounded cursor-pointer transition-shadow hover:shadow-lg group",
              statusColor,
              isDragging && "opacity-70",
              isResizing && "cursor-ew-resize",
              showCriticalPath && isCritical && CRITICAL_PATH_COLOR
            )}
            style={{
              left: displayLeft,
              width: Math.max(displayWidth, dayWidth),
              top: (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2,
              height: TASK_BAR_HEIGHT,
            }}
          >
            {/* Progress bar */}
            <div
              className="absolute inset-y-0 left-0 rounded-l bg-black/20"
              style={{ width: `${task.progress}%` }}
            />

            {/* Task title */}
            <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
              <span className="text-xs text-white font-medium truncate">
                {task.title}
              </span>
            </div>

            {/* Priority indicator */}
            <div
              className={cn("absolute top-0 left-0 w-1 h-full rounded-l", priorityColor)}
            />

            {/* Critical path indicator */}
            {showCriticalPath && isCritical && (
              <div className="absolute -top-1 -right-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
              </div>
            )}

            {/* Resize handle (left) */}
            <div
              className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-l"
              onMouseDown={(e) => handleResizeStart(e, "left")}
            />

            {/* Resize handle (right) */}
            <div
              className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-r"
              onMouseDown={(e) => handleResizeStart(e, "right")}
            />
          </div>
        </ClientTooltipTrigger>
        <ClientTooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(task.startDate, "full")} - {formatDate(task.endDate, "full")}
            </p>
            <p className="text-xs">Progress: {task.progress}%</p>
            {task.assigneeName && (
              <p className="text-xs flex items-center gap-1">
                <User className="h-3 w-3" /> {task.assigneeName}
              </p>
            )}
            {showCriticalPath && isCritical && (
              <Badge variant="destructive" className="text-xs">Critical Path</Badge>
            )}
          </div>
        </ClientTooltipContent>
      </ClientTooltip>
    </ClientTooltipProvider>
  )
}

// ============ Today Line ============
function TodayLine({ config }: { config: TimelineConfig }) {
  const today = startOfDay(new Date())
  const offsetDays = diffDays(config.startDate, today)
  
  if (offsetDays < 0 || offsetDays > config.totalDays) return null
  
  const left = offsetDays * config.dayWidth

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
      style={{ left }}
    >
      <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-red-500" />
    </div>
  )
}

// ============ Resource Allocation Row ============
function ResourceRow({
  tasks,
  config,
  assignees,
}: {
  tasks: GanttTask[]
  config: TimelineConfig
  assignees: { id: string; name: string }[]
}) {
  const { startDate: timelineStart, dayWidth, totalDays } = config

  // Calculate workload per assignee per day
  const workloadMap = useMemo(() => {
    const map = new Map<string, Map<number, number>>() // assigneeId -> day -> task count
    
    tasks.forEach((task) => {
      if (!task.assigneeId) return
      
      if (!map.has(task.assigneeId)) {
        map.set(task.assigneeId, new Map())
      }
      const assigneeMap = map.get(task.assigneeId)!
      
      const startDay = diffDays(timelineStart, task.startDate)
      const endDay = diffDays(timelineStart, task.endDate)
      
      for (let day = Math.max(0, startDay); day <= Math.min(totalDays, endDay); day++) {
        assigneeMap.set(day, (assigneeMap.get(day) ?? 0) + 1)
      }
    })
    
    return map
  }, [tasks, timelineStart, totalDays])

  if (assignees.length === 0) return null

  return (
    <div className="border-t bg-muted/20">
      <div className="h-8 px-4 flex items-center text-xs font-medium text-muted-foreground border-b">
        Resource Allocation
      </div>
      {assignees.map((assignee) => {
        const assigneeWorkload = workloadMap.get(assignee.id)
        
        return (
          <div
            key={assignee.id}
            className="flex items-center border-b"
            style={{ height: RESOURCE_ROW_HEIGHT }}
          >
            {/* Assignee name */}
            <div
              className="flex items-center gap-2 px-4 border-r bg-background"
              style={{ width: LEFT_PANEL_WIDTH, flexShrink: 0 }}
            >
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs truncate">{assignee.name}</span>
            </div>
            
            {/* Workload visualization */}
            <div className="relative flex-1" style={{ height: RESOURCE_ROW_HEIGHT }}>
              {assigneeWorkload && Array.from(assigneeWorkload.entries()).map(([day, count]) => {
                const intensity = Math.min(count / 3, 1) // Cap at 3 tasks per day for full intensity
                return (
                  <div
                    key={day}
                    className="absolute top-1 bottom-1 rounded-sm"
                    style={{
                      left: day * dayWidth,
                      width: dayWidth - 1,
                      backgroundColor: count > 2 ? "var(--critical)" : "var(--primary)",
                      opacity: intensity,
                    }}
                    title={`${count} task(s)`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============ Main Component ============
export default function GanttChartPage() {
  // ============ ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ============
  
  // State for hydration-safe mounting
  const [mounted, setMounted] = useState(false)
  
  const { user, isLoading, isAuthenticated } = useUser()
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState<ZoomLevel>("week")
  const [viewStartDate, setViewStartDate] = useState(() => {
    const today = new Date()
    return addDays(today, -14) // Start 2 weeks before today
  })
  const [showCriticalPath, setShowCriticalPath] = useState(false)
  const [showResourceRow, setShowResourceRow] = useState(false)
  const [showDependencies, setShowDependencies] = useState(true)

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading, error } = useTasksQuery(
    { sortBy: "dueDate", sortOrder: "asc" },
    { enabled: !!user?.id }
  )

  const updateTaskMutation = useUpdateTaskMutation()

  // Convert tasks to Gantt format
  const ganttTasks = useMemo(() => {
    const tasks = tasksData?.items ?? []
    return tasks
      .map(convertToGanttTask)
      .filter((t): t is GanttTask => t !== null)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }, [tasksData?.items])

  // Build task index map for dependency calculations
  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    ganttTasks.forEach((task, index) => {
      map.set(task.id, index)
    })
    return map
  }, [ganttTasks])

  // Calculate critical path
  const criticalPathIds = useMemo(() => {
    if (!showCriticalPath) return new Set<string>()
    return calculateCriticalPath(ganttTasks)
  }, [ganttTasks, showCriticalPath])

  // Get unique assignees
  const assignees = useMemo(() => {
    const seen = new Map<string, string>()
    ganttTasks.forEach((task) => {
      if (task.assigneeId && task.assigneeName && !seen.has(task.assigneeId)) {
        seen.set(task.assigneeId, task.assigneeName)
      }
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [ganttTasks])

  // Timeline config
  const timelineConfig = useMemo<TimelineConfig>(() => {
    const dayWidth = ZOOM_CONFIGS[zoom].dayWidth
    const startDate = startOfDay(viewStartDate)
    const totalDays = zoom === "day" ? 30 : zoom === "week" ? 90 : zoom === "month" ? 180 : 365
    const endDate = addDays(startDate, totalDays)
    return { startDate, endDate, dayWidth, totalDays }
  }, [zoom, viewStartDate])

  // Calculate dependency arrows
  const dependencyArrows = useMemo(() => {
    if (!showDependencies) return []
    return calculateDependencyArrows(ganttTasks, timelineConfig, taskIndexMap)
  }, [ganttTasks, timelineConfig, taskIndexMap, showDependencies])

  // Navigation
  const navigateTimeline = useCallback((direction: "prev" | "next") => {
    const days = zoom === "day" ? 7 : zoom === "week" ? 30 : zoom === "month" ? 90 : 180
    setViewStartDate((prev) =>
      addDays(prev, direction === "next" ? days : -days)
    )
  }, [zoom])

  const goToToday = useCallback(() => {
    setViewStartDate(addDays(new Date(), -14))
  }, [])

  // Handle task drag/resize
  const handleTaskDragEnd = useCallback(
    (taskId: string, newStart: Date, newEnd: Date) => {
      updateTaskMutation.mutate({
        id: taskId,
        data: {
          dueDate: newEnd.toISOString(),
        },
      })
    },
    [updateTaskMutation]
  )

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

  // Auth guards
  if (isLoading) {
    return (
      <div className="p-4">
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Loading authentication...</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAuthenticated || !user?.id) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Not authenticated. Please log in.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Failed to load tasks: {String(error)}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const timelineWidth = timelineConfig.totalDays * timelineConfig.dayWidth

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Gantt Chart</h1>
          <p className="text-muted-foreground">
            {ganttTasks.length} tasks with dates
            {showCriticalPath && criticalPathIds.size > 0 && (
              <span className="text-red-500 ml-2">
                • {criticalPathIds.size} on critical path
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Feature toggles */}
          <div className="flex items-center gap-4 border-r pr-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-deps"
                checked={showDependencies}
                onCheckedChange={setShowDependencies}
              />
              <Label htmlFor="show-deps" className="text-sm">Dependencies</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="critical-path"
                checked={showCriticalPath}
                onCheckedChange={setShowCriticalPath}
              />
              <Label htmlFor="critical-path" className="text-sm">Critical Path</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="resource-row"
                checked={showResourceRow}
                onCheckedChange={setShowResourceRow}
              />
              <Label htmlFor="resource-row" className="text-sm">Resources</Label>
            </div>
          </div>

          {/* Navigation */}
          <Button variant="outline" size="icon" onClick={() => navigateTimeline("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarDays className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateTimeline("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Zoom */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((prev) => {
                if (prev === "quarter") return "month"
                if (prev === "month") return "week"
                return "day"
              })}
              disabled={zoom === "day"}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <ClientSelect value={zoom} onValueChange={(v) => setZoom(v as ZoomLevel)}>
              <ClientSelectTrigger className="w-28">
                <ClientSelectValue />
              </ClientSelectTrigger>
              <ClientSelectContent>
                <ClientSelectItem value="day">Day</ClientSelectItem>
                <ClientSelectItem value="week">Week</ClientSelectItem>
                <ClientSelectItem value="month">Month</ClientSelectItem>
                <ClientSelectItem value="quarter">Quarter</ClientSelectItem>
              </ClientSelectContent>
            </ClientSelect>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((prev) => {
                if (prev === "day") return "week"
                if (prev === "week") return "month"
                return "quarter"
              })}
              disabled={zoom === "quarter"}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Task List */}
        <div
          className="border-r bg-background"
          style={{ width: LEFT_PANEL_WIDTH, flexShrink: 0 }}
        >
          {/* Header */}
          <div className="h-20 border-b px-4 flex items-center">
            <span className="font-medium">Tasks</span>
          </div>

          {/* Task rows */}
          <div className="overflow-y-auto" style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}>
            {tasksLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : ganttTasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks with dates</p>
              </div>
            ) : (
              ganttTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center px-4 border-b hover:bg-muted/50"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Status Icon */}
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                  ) : task.status === "in_progress" ? (
                    <Clock className="h-4 w-4 text-blue-500 mr-2 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                  )}

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(task.startDate, "full")} - {formatDate(task.endDate, "full")}
                    </p>
                  </div>

                  {/* Milestone indicator */}
                  {task.isMilestone && (
                    <Flag className="h-4 w-4 text-orange-500 ml-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Timeline */}
        <div ref={containerRef} className="flex-1 overflow-auto">
          <div style={{ width: timelineWidth, minWidth: "100%" }}>
            {/* Timeline Header */}
            <TimelineHeader config={timelineConfig} zoom={zoom} />

            {/* Timeline Body */}
            <div className="relative" style={{ height: ganttTasks.length * ROW_HEIGHT }}>
              {/* Grid lines (vertical) */}
              {Array.from({ length: timelineConfig.totalDays }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute top-0 bottom-0 border-l",
                    i % 7 === 0 ? "border-border" : "border-border/30"
                  )}
                  style={{ left: i * timelineConfig.dayWidth }}
                />
              ))}

              {/* Row backgrounds */}
              {ganttTasks.map((task, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute left-0 right-0 border-b",
                    i % 2 === 0 ? "bg-background" : "bg-muted/20",
                    showCriticalPath && criticalPathIds.has(task.id) && "bg-red-50 dark:bg-red-950/20"
                  )}
                  style={{
                    top: i * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                  }}
                />
              ))}

              {/* Today line */}
              <TodayLine config={timelineConfig} />

              {/* Dependency arrows */}
              {showDependencies && dependencyArrows.length > 0 && (
                <DependencyArrowsSVG
                  arrows={dependencyArrows}
                  showCriticalPath={showCriticalPath}
                  criticalPathIds={criticalPathIds}
                />
              )}

              {/* Task bars */}
              {ganttTasks.map((task, i) => (
                <div
                  key={task.id}
                  className="absolute left-0 right-0"
                  style={{
                    top: i * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                  }}
                >
                  <GanttBar
                    task={task}
                    config={timelineConfig}
                    onDragEnd={handleTaskDragEnd}
                    showCriticalPath={showCriticalPath}
                    isCritical={criticalPathIds.has(task.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resource Allocation Row */}
      {showResourceRow && assignees.length > 0 && (
        <ResourceRow
          tasks={ganttTasks}
          config={timelineConfig}
          assignees={assignees}
        />
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 p-4 border-t bg-muted/30">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status:</span>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded", color)} />
              <span className="capitalize">{status.replace("_", " ")}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Priority:</span>
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded", color)} />
              <span className="capitalize">{priority}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rotate-45 bg-orange-500" />
          <span>Milestone</span>
        </div>
      </div>
    </div>
  )
}
