/**
 * @domain magictodo
 * @layer ui
 * @responsibility Pre-submit task warnings and smart suggestions
 * Magic Insights Panel - Shows contextual warnings and suggestions before task submission
 */

"use client"

import { useMemo } from "react"
import { Alert, AlertDescription, AlertTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { ScrollArea } from "@afenda/shadcn"
import {
  AlertTriangle,
  Calendar,
  Clock,
  Lightbulb,
  TrendingUp,
  Users,
  Zap,
  Target,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"

// ============ Types ============
export type InsightType = "warning" | "suggestion" | "info" | "success"
export type InsightCategory = 
  | "scheduling" 
  | "workload" 
  | "dependency" 
  | "deadline" 
  | "priority"
  | "collaboration"
  | "habit"

export interface Insight {
  id: string
  type: InsightType
  category: InsightCategory
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface TaskData {
  title?: string
  description?: string
  dueDate?: Date | null
  priority?: "low" | "medium" | "high" | "urgent"
  estimatedMinutes?: number
  projectId?: string
  assigneeId?: string
  tags?: string[]
}

interface ExistingTasks {
  dueSameDay: number
  dueThisWeek: number
  urgentCount: number
  overdueCount: number
  averageCompletionTime?: number
}

// ============ Insight Analysis ============
function analyzeTask(task: TaskData, existing: ExistingTasks): Insight[] {
  const insights: Insight[] = []

  // Check for overloaded days
  if (task.dueDate && existing.dueSameDay >= 5) {
    insights.push({
      id: "overloaded-day",
      type: "warning",
      category: "workload",
      title: "Busy Day Ahead",
      description: `You already have ${existing.dueSameDay} tasks due on this date. Consider spreading out your workload.`,
    })
  }

  // Check for unrealistic deadline
  if (task.dueDate) {
    const now = new Date()
    const hoursUntilDue = (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    const estimatedHours = (task.estimatedMinutes || 30) / 60

    if (hoursUntilDue < estimatedHours && hoursUntilDue > 0) {
      insights.push({
        id: "tight-deadline",
        type: "warning",
        category: "deadline",
        title: "Tight Deadline",
        description: `The estimated time (${task.estimatedMinutes}min) may not fit before the due date.`,
      })
    }
  }

  // Check for missing priority on near deadline
  if (task.dueDate && !task.priority) {
    const now = new Date()
    const daysUntilDue = (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysUntilDue <= 2) {
      insights.push({
        id: "missing-priority",
        type: "suggestion",
        category: "priority",
        title: "Consider Setting Priority",
        description: "This task is due soon. Setting a priority helps with focus planning.",
      })
    }
  }

  // Check for very high priority overload
  if (task.priority === "urgent" && existing.urgentCount >= 3) {
    insights.push({
      id: "too-many-urgent",
      type: "warning",
      category: "priority",
      title: "Too Many Urgent Tasks",
      description: `You have ${existing.urgentCount} urgent tasks. When everything is urgent, nothing is.`,
    })
  }

  // Suggest time estimation if missing
  if (!task.estimatedMinutes && task.title && task.title.length > 10) {
    insights.push({
      id: "add-time-estimate",
      type: "suggestion",
      category: "scheduling",
      title: "Add Time Estimate",
      description: "Adding an estimated duration helps with daily planning and focus sessions.",
    })
  }

  // Check for weekend scheduling
  if (task.dueDate) {
    const dayOfWeek = task.dueDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      insights.push({
        id: "weekend-task",
        type: "info",
        category: "scheduling",
        title: "Weekend Task",
        description: "This task is scheduled for the weekend. Make sure that's intentional.",
      })
    }
  }

  // Positive reinforcement
  if (existing.overdueCount === 0 && existing.dueThisWeek <= 5) {
    insights.push({
      id: "good-workload",
      type: "success",
      category: "workload",
      title: "Healthy Workload",
      description: "Your current task load looks manageable. Great job!",
    })
  }

  // Warn about overdue tasks
  if (existing.overdueCount > 0) {
    insights.push({
      id: "has-overdue",
      type: "warning",
      category: "deadline",
      title: "Overdue Tasks Exist",
      description: `You have ${existing.overdueCount} overdue tasks. Consider addressing those first.`,
    })
  }

  return insights
}

// ============ Icon Mapping ============
const CATEGORY_ICONS = {
  scheduling: Calendar,
  workload: TrendingUp,
  dependency: Zap,
  deadline: Clock,
  priority: Target,
  collaboration: Users,
  habit: Lightbulb,
}

const TYPE_ICONS = {
  warning: AlertTriangle,
  suggestion: Lightbulb,
  info: Info,
  success: CheckCircle2,
}

const TYPE_STYLES = {
  warning: {
    border: "border-yellow-500/50",
    bg: "bg-yellow-500/10",
    icon: "text-yellow-500",
  },
  suggestion: {
    border: "border-blue-500/50",
    bg: "bg-blue-500/10",
    icon: "text-blue-500",
  },
  info: {
    border: "border-gray-500/50",
    bg: "bg-gray-500/10",
    icon: "text-gray-500",
  },
  success: {
    border: "border-green-500/50",
    bg: "bg-green-500/10",
    icon: "text-green-500",
  },
}

// ============ Single Insight Component ============
interface InsightItemProps {
  insight: Insight
  compact?: boolean
}

function InsightItem({ insight, compact = false }: InsightItemProps) {
  const TypeIcon = TYPE_ICONS[insight.type]
  const CategoryIcon = CATEGORY_ICONS[insight.category]
  const styles = TYPE_STYLES[insight.type]

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-2 p-2 rounded-md text-sm",
          styles.bg
        )}
      >
        <TypeIcon className={cn("h-4 w-4 mt-0.5 shrink-0", styles.icon)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{insight.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {insight.description}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Alert className={cn("border", styles.border, styles.bg)}>
      <TypeIcon className={cn("h-4 w-4", styles.icon)} />
      <AlertTitle className="flex items-center gap-2">
        {insight.title}
        <Badge variant="outline" className="ml-auto text-xs capitalize">
          <CategoryIcon className="h-3 w-3 mr-1" />
          {insight.category}
        </Badge>
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between mt-1">
        <span>{insight.description}</span>
        {insight.action && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-2 shrink-0"
            onClick={insight.action.onClick}
          >
            {insight.action.label}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// ============ Main Panel Component ============
interface MagicInsightsPanelProps {
  task: TaskData
  existingTasks?: ExistingTasks
  className?: string
  compact?: boolean
  maxInsights?: number
  filterTypes?: InsightType[]
  onInsightAction?: (insight: Insight) => void
}

export function MagicInsightsPanel({
  task,
  existingTasks = {
    dueSameDay: 0,
    dueThisWeek: 0,
    urgentCount: 0,
    overdueCount: 0,
  },
  className,
  compact = false,
  maxInsights = 5,
  filterTypes,
  onInsightAction,
}: MagicInsightsPanelProps) {
  const insights = useMemo(() => {
    let result = analyzeTask(task, existingTasks)

    // Filter by type if specified
    if (filterTypes && filterTypes.length > 0) {
      result = result.filter((i) => filterTypes.includes(i.type))
    }

    // Limit insights
    return result.slice(0, maxInsights)
  }, [task, existingTasks, filterTypes, maxInsights])

  if (insights.length === 0) {
    return null
  }

  const warningCount = insights.filter((i) => i.type === "warning").length
  const suggestionCount = insights.filter((i) => i.type === "suggestion").length

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {insights.map((insight) => (
          <InsightItem key={insight.id} insight={insight} compact />
        ))}
      </div>
    )
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Task Insights
          {warningCount > 0 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/50">
              {warningCount} warning{warningCount > 1 ? "s" : ""}
            </Badge>
          )}
          {suggestionCount > 0 && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/50">
              {suggestionCount} suggestion{suggestionCount > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className={insights.length > 3 ? "h-64" : undefined}>
          <div className="space-y-3">
            {insights.map((insight) => (
              <InsightItem
                key={insight.id}
                insight={{
                  ...insight,
                  action: insight.action || (onInsightAction
                    ? {
                        label: "Apply",
                        onClick: () => onInsightAction(insight),
                      }
                    : undefined),
                }}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ============ Inline Warning Component ============
interface InlineInsightProps {
  task: TaskData
  existingTasks?: ExistingTasks
  className?: string
}

export function InlineTaskInsights({
  task,
  existingTasks,
  className,
}: InlineInsightProps) {
  const warnings = useMemo(() => {
    const insights = analyzeTask(task, existingTasks || {
      dueSameDay: 0,
      dueThisWeek: 0,
      urgentCount: 0,
      overdueCount: 0,
    })
    return insights.filter((i) => i.type === "warning").slice(0, 2)
  }, [task, existingTasks])

  if (warnings.length === 0) return null

  return (
    <div className={cn("flex items-center gap-2 text-sm text-yellow-600", className)}>
      <AlertCircle className="h-4 w-4" />
      <span>{warnings.map((w) => w.title).join(" • ")}</span>
    </div>
  )
}

// ============ Hook for Insights ============
export function useTaskInsights(task: TaskData, existingTasks?: ExistingTasks) {
  return useMemo(() => analyzeTask(task, existingTasks || {
    dueSameDay: 0,
    dueThisWeek: 0,
    urgentCount: 0,
    overdueCount: 0,
  }), [task, existingTasks])
}
