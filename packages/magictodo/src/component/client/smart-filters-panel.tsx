/**
 * MagicTodo Smart Filters Panel
 * 
 * @domain magictodo
 * @layer component
 * @responsibility Quick access filters for MagicTodo-specific conditions
 */

"use client"

import { cn } from "@afenda/shared/utils"
import { Badge } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { 
  BellOff, 
  AlertCircle, 
  ListTodo, 
  Timer, 
  Calendar,
  Flag,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
} from "lucide-react"

export type SmartFilterType = 
  | "all"
  | "snoozed"
  | "blocked"
  | "with-subtasks"
  | "with-timer"
  | "overdue"
  | "due-today"
  | "due-this-week"
  | "high-priority"
  | "completed-today"
  | "no-due-date"

export interface SmartFilterOption {
  id: SmartFilterType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  count?: number
}

export const MAGICTODO_SMART_FILTERS: SmartFilterOption[] = [
  {
    id: "all",
    label: "All Tasks",
    description: "Show all tasks",
    icon: CheckCircle2,
    badgeVariant: "outline",
  },
  {
    id: "snoozed",
    label: "Snoozed",
    description: "Tasks snoozed for later",
    icon: BellOff,
    badgeVariant: "secondary",
  },
  {
    id: "blocked",
    label: "Blocked",
    description: "Tasks blocked by dependencies",
    icon: AlertCircle,
    badgeVariant: "destructive",
  },
  {
    id: "with-subtasks",
    label: "With Subtasks",
    description: "Tasks that have subtasks",
    icon: ListTodo,
    badgeVariant: "outline",
  },
  {
    id: "with-timer",
    label: "Timer Running",
    description: "Tasks with active time tracking",
    icon: Timer,
    badgeVariant: "default",
  },
  {
    id: "overdue",
    label: "Overdue",
    description: "Past due tasks",
    icon: Flame,
    badgeVariant: "destructive",
  },
  {
    id: "due-today",
    label: "Due Today",
    description: "Tasks due today",
    icon: Calendar,
    badgeVariant: "default",
  },
  {
    id: "due-this-week",
    label: "Due This Week",
    description: "Tasks due this week",
    icon: Clock,
    badgeVariant: "secondary",
  },
  {
    id: "high-priority",
    label: "High Priority",
    description: "High and urgent priority tasks",
    icon: Flag,
    badgeVariant: "destructive",
  },
  {
    id: "completed-today",
    label: "Done Today",
    description: "Tasks completed today",
    icon: CheckCircle2,
    badgeVariant: "outline",
  },
  {
    id: "no-due-date",
    label: "No Due Date",
    description: "Tasks without a due date",
    icon: XCircle,
    badgeVariant: "outline",
  },
]

export interface SmartFiltersPanelProps {
  activeFilter: SmartFilterType
  onFilterChange: (filter: SmartFilterType) => void
  counts?: Partial<Record<SmartFilterType, number>>
  className?: string
  /** Show only priority filters (compact mode) */
  compact?: boolean
}

export function SmartFiltersPanel({
  activeFilter,
  onFilterChange,
  counts = {},
  className,
  compact = false,
}: SmartFiltersPanelProps) {
  // In compact mode, show only key filters
  const displayFilters = compact 
    ? MAGICTODO_SMART_FILTERS.filter(f => 
        ["all", "snoozed", "blocked", "overdue", "due-today", "high-priority"].includes(f.id)
      )
    : MAGICTODO_SMART_FILTERS

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayFilters.map((filter) => {
        const Icon = filter.icon
        const isActive = activeFilter === filter.id
        const count = counts[filter.id]

        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "gap-1.5 h-8",
              isActive && filter.id === "blocked" && "bg-orange-600 hover:bg-orange-700",
              isActive && filter.id === "snoozed" && "bg-amber-600 hover:bg-amber-700",
              isActive && filter.id === "overdue" && "bg-red-600 hover:bg-red-700",
              isActive && filter.id === "with-timer" && "bg-blue-600 hover:bg-blue-700",
            )}
            title={filter.description}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{filter.label}</span>
            {count !== undefined && count > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-5 px-1.5 min-w-[20px] text-xs",
                  isActive && "bg-white/20 text-white"
                )}
              >
                {count}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}

/**
 * Hook to compute smart filter counts from tasks and indicators
 */
export function useSmartFilterCounts(
  tasks: Array<{ 
    id: string
    status: string
    priority?: string
    dueDate?: string | Date | null
    completedAt?: string | Date | null
  }>,
  indicatorsMap: Map<string, { 
    isSnoozed?: boolean
    isBlocked?: boolean
    subtaskCount?: number
    hasActiveTimer?: boolean
  }>
): Partial<Record<SmartFilterType, number>> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000)

  const counts: Partial<Record<SmartFilterType, number>> = {
    all: tasks.length,
    snoozed: 0,
    blocked: 0,
    "with-subtasks": 0,
    "with-timer": 0,
    overdue: 0,
    "due-today": 0,
    "due-this-week": 0,
    "high-priority": 0,
    "completed-today": 0,
    "no-due-date": 0,
  }

  for (const task of tasks) {
    const indicators = indicatorsMap.get(task.id)
    const dueDate = task.dueDate ? new Date(task.dueDate) : null
    const completedAt = task.completedAt ? new Date(task.completedAt) : null

    // Snoozed
    if (indicators?.isSnoozed) counts.snoozed!++

    // Blocked
    if (indicators?.isBlocked) counts.blocked!++

    // With subtasks
    if (indicators?.subtaskCount && indicators.subtaskCount > 0) counts["with-subtasks"]!++

    // With active timer
    if (indicators?.hasActiveTimer) counts["with-timer"]!++

    // Overdue
    if (dueDate && dueDate < now && task.status !== "done") counts.overdue!++

    // Due today
    if (dueDate && dueDate >= startOfDay && dueDate < endOfDay && task.status !== "done") {
      counts["due-today"]!++
    }

    // Due this week
    if (dueDate && dueDate >= startOfDay && dueDate < endOfWeek && task.status !== "done") {
      counts["due-this-week"]!++
    }

    // High priority
    if ((task.priority === "high" || task.priority === "urgent") && task.status !== "done") {
      counts["high-priority"]!++
    }

    // Completed today
    if (completedAt && completedAt >= startOfDay && completedAt < endOfDay) {
      counts["completed-today"]!++
    }

    // No due date
    if (!dueDate && task.status !== "done") counts["no-due-date"]!++
  }

  return counts
}

/**
 * Apply smart filter to tasks
 */
export function applySmartFilter<T extends { 
  id: string
  status: string
  priority?: string
  dueDate?: string | Date | null
  completedAt?: string | Date | null
}>(
  tasks: T[],
  filter: SmartFilterType,
  indicatorsMap: Map<string, { 
    isSnoozed?: boolean
    isBlocked?: boolean
    subtaskCount?: number
    hasActiveTimer?: boolean
  }>
): T[] {
  if (filter === "all") return tasks

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000)

  return tasks.filter((task) => {
    const indicators = indicatorsMap.get(task.id)
    const dueDate = task.dueDate ? new Date(task.dueDate) : null
    const completedAt = task.completedAt ? new Date(task.completedAt) : null

    switch (filter) {
      case "snoozed":
        return indicators?.isSnoozed
      case "blocked":
        return indicators?.isBlocked
      case "with-subtasks":
        return indicators?.subtaskCount && indicators.subtaskCount > 0
      case "with-timer":
        return indicators?.hasActiveTimer
      case "overdue":
        return dueDate && dueDate < now && task.status !== "done"
      case "due-today":
        return dueDate && dueDate >= startOfDay && dueDate < endOfDay && task.status !== "done"
      case "due-this-week":
        return dueDate && dueDate >= startOfDay && dueDate < endOfWeek && task.status !== "done"
      case "high-priority":
        return (task.priority === "high" || task.priority === "urgent") && task.status !== "done"
      case "completed-today":
        return completedAt && completedAt >= startOfDay && completedAt < endOfDay
      case "no-due-date":
        return !dueDate && task.status !== "done"
      default:
        return true
    }
  })
}
