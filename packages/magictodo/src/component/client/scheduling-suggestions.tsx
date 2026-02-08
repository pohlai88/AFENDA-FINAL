/* eslint-disable react-hooks/static-components -- icon component selected dynamically by time slot */
/**
 * @domain magictodo
 * @layer ui
 * @responsibility Smart reschedule suggestions based on workload and patterns
 * Scheduling Suggestions - Provides intelligent date/time recommendations
 */

"use client"

import { useMemo, useState, useCallback } from "react"
import { Button } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { ScrollArea } from "@afenda/shadcn"
import {
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
} from "@afenda/shadcn"
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn"
import {
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  Sun,
  Moon,
  Coffee,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"

// ============ Types ============
export interface WorkloadDay {
  date: Date
  taskCount: number
  totalMinutes: number
  urgentCount: number
  blockedCount: number
}

export interface ProductivityPattern {
  bestDayOfWeek: number // 0-6
  bestTimeOfDay: "morning" | "afternoon" | "evening"
  averageTasksPerDay: number
  averageMinutesPerDay: number
  completionRateByDay: Record<number, number>
  completionRateByTime: Record<string, number>
}

export interface SchedulingSuggestion {
  id: string
  type: "optimal" | "alternative" | "warning" | "spread"
  date: Date
  timeSlot?: "morning" | "afternoon" | "evening"
  reason: string
  confidence: number // 0-1
  workloadScore: number // 0-100, lower is better
}

export interface TaskContext {
  title: string
  estimatedMinutes?: number
  priority?: "low" | "medium" | "high" | "urgent"
  deadline?: Date
  dependencies?: string[]
}

// ============ Analysis Functions ============
function getDayName(dayOfWeek: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek] ?? ""
}

function getTimeSlotIcon(timeSlot: "morning" | "afternoon" | "evening") {
  switch (timeSlot) {
    case "morning":
      return Coffee
    case "afternoon":
      return Sun
    case "evening":
      return Moon
  }
}

function calculateWorkloadScore(day: WorkloadDay, averageMinutes: number): number {
  // Score based on how busy the day is relative to average
  const minuteRatio = day.totalMinutes / (averageMinutes || 60)
  const taskWeight = Math.min(day.taskCount / 5, 2) * 20
  const urgentWeight = day.urgentCount * 15
  const blockedWeight = day.blockedCount * 10

  return Math.min(100, Math.round(minuteRatio * 30 + taskWeight + urgentWeight + blockedWeight))
}

function generateSuggestions(
  task: TaskContext,
  workload: WorkloadDay[],
  patterns: ProductivityPattern
): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = []
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Sort workload by date
  const sortedWorkload = [...workload].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  // Find optimal days (lowest workload)
  const futureWorkload = sortedWorkload.filter(
    (d) => d.date.getTime() >= today.getTime()
  )

  if (futureWorkload.length === 0) return suggestions

  // Calculate average for scoring
  const avgMinutes = patterns.averageMinutesPerDay || 120

  // Add workload scores
  const scoredDays = futureWorkload.map((day) => ({
    ...day,
    workloadScore: calculateWorkloadScore(day, avgMinutes),
  }))

  // Sort by workload score (lowest first)
  scoredDays.sort((a, b) => a.workloadScore - b.workloadScore)

  // Best day suggestion
  const bestDay = scoredDays[0]
  if (bestDay) {
    const isBestDayOfWeek = bestDay.date.getDay() === patterns.bestDayOfWeek

    suggestions.push({
      id: `optimal-${bestDay.date.toISOString()}`,
      type: "optimal",
      date: bestDay.date,
      timeSlot: patterns.bestTimeOfDay,
      reason: isBestDayOfWeek
        ? `Your most productive day with lowest workload (${bestDay.taskCount} tasks)`
        : `Lightest workload day (${bestDay.taskCount} tasks, ${bestDay.totalMinutes}min planned)`,
      confidence: isBestDayOfWeek ? 0.95 : 0.85,
      workloadScore: bestDay.workloadScore,
    })
  }

  // Alternative days (2nd and 3rd best)
  scoredDays.slice(1, 3).forEach((day, index) => {
    suggestions.push({
      id: `alternative-${day.date.toISOString()}`,
      type: "alternative",
      date: day.date,
      timeSlot: patterns.bestTimeOfDay,
      reason: `Alternative: ${day.taskCount} tasks, ${day.totalMinutes}min planned`,
      confidence: 0.7 - index * 0.1,
      workloadScore: day.workloadScore,
    })
  })

  // Spread suggestion for large tasks
  if ((task.estimatedMinutes || 0) > 60) {
    const lowWorkloadDays = scoredDays
      .filter((d) => d.workloadScore < 50)
      .slice(0, 3)

    if (lowWorkloadDays.length >= 2) {
      suggestions.push({
        id: "spread-suggestion",
        type: "spread",
        date: lowWorkloadDays[0]!.date,
        reason: `Consider breaking this ${task.estimatedMinutes}min task across ${lowWorkloadDays.length} days`,
        confidence: 0.65,
        workloadScore: 30,
      })
    }
  }

  // Warning for deadline proximity
  if (task.deadline) {
    const daysUntilDeadline = Math.floor(
      (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDeadline <= 2 && daysUntilDeadline > 0) {
      suggestions.push({
        id: "deadline-warning",
        type: "warning",
        date: task.deadline,
        reason: `Deadline in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? "s" : ""}! Schedule soon.`,
        confidence: 1,
        workloadScore: 100,
      })
    }
  }

  // Priority-based urgency
  if (task.priority === "urgent" && !task.deadline) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    suggestions.unshift({
      id: "urgent-tomorrow",
      type: "optimal",
      date: tomorrow,
      timeSlot: "morning",
      reason: "Urgent task - schedule for tomorrow morning",
      confidence: 0.9,
      workloadScore: 20,
    })
  }

  return suggestions.slice(0, 5) // Limit to 5 suggestions
}

// ============ Suggestion Card Component ============
interface SuggestionCardProps {
  suggestion: SchedulingSuggestion
  onSelect: (suggestion: SchedulingSuggestion) => void
  isSelected?: boolean
}

function SuggestionCard({ suggestion, onSelect, isSelected }: SuggestionCardProps) {
  const TimeIcon = suggestion.timeSlot
    ? getTimeSlotIcon(suggestion.timeSlot)
    : Clock

  const typeConfig = {
    optimal: {
      icon: Zap,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/50",
      label: "Recommended",
    },
    alternative: {
      icon: Calendar,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/50",
      label: "Alternative",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/50",
      label: "Warning",
    },
    spread: {
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/50",
      label: "Spread",
    },
  }

  const config = typeConfig[suggestion.type]
  const TypeIcon = config.icon

  const formattedDate = suggestion.date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <button
      onClick={() => onSelect(suggestion)}
      className={cn(
        "w-full text-left p-3 rounded-lg border-2 transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : `border-transparent ${config.bg} hover:border-muted-foreground/20`
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-full", config.bg)}>
          <TypeIcon className={cn("h-4 w-4", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{formattedDate}</span>
            {suggestion.timeSlot && (
              <Badge variant="outline" className="text-xs capitalize">
                <TimeIcon className="h-3 w-3 mr-1" />
                {suggestion.timeSlot}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-xs ml-auto", config.bg, config.color)}>
              {config.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {suggestion.reason}
          </p>

          <div className="flex items-center gap-4 mt-2 text-xs">
            <ClientTooltipProvider>
              <ClientTooltip>
                <ClientTooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </ClientTooltipTrigger>
                <ClientTooltipContent>
                  Based on your productivity patterns
                </ClientTooltipContent>
              </ClientTooltip>
            </ClientTooltipProvider>

            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {suggestion.workloadScore}% workload
            </span>
          </div>
        </div>

        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
      </div>
    </button>
  )
}

// ============ Main Component ============
interface SchedulingSuggestionsProps {
  task: TaskContext
  workload: WorkloadDay[]
  patterns: ProductivityPattern
  onSelectDate: (date: Date, timeSlot?: "morning" | "afternoon" | "evening") => void
  className?: string
  variant?: "inline" | "popover" | "card"
}

export function SchedulingSuggestions({
  task,
  workload,
  patterns,
  onSelectDate,
  className,
  variant = "card",
}: SchedulingSuggestionsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const suggestions = useMemo(
    () => generateSuggestions(task, workload, patterns),
    [task, workload, patterns]
  )

  const handleSelect = useCallback(
    (suggestion: SchedulingSuggestion) => {
      setSelectedId(suggestion.id)
      onSelectDate(suggestion.date, suggestion.timeSlot)
    },
    [onSelectDate]
  )

  if (suggestions.length === 0) {
    return null
  }

  const content = (
    <div className="space-y-2">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onSelect={handleSelect}
          isSelected={selectedId === suggestion.id}
        />
      ))}
    </div>
  )

  if (variant === "inline") {
    return <div className={className}>{content}</div>
  }

  if (variant === "popover") {
    return (
      <ClientPopover>
        <ClientPopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Sparkles className="h-4 w-4" />
            Smart schedule
          </Button>
        </ClientPopoverTrigger>
        <ClientPopoverContent align="start" className="w-96 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <h4 className="font-medium">Scheduling Suggestions</h4>
            </div>
            <ScrollArea className="max-h-80">{content}</ScrollArea>
          </div>
        </ClientPopoverContent>
      </ClientPopover>
    )
  }

  // Card variant
  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Smart Scheduling
          <Badge variant="outline" className="ml-auto text-xs">
            {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className={suggestions.length > 3 ? "h-64" : undefined}>
          {content}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ============ Quick Suggest Button ============
interface QuickScheduleButtonProps {
  task: TaskContext
  workload: WorkloadDay[]
  patterns: ProductivityPattern
  onSchedule: (date: Date, timeSlot?: "morning" | "afternoon" | "evening") => void
  className?: string
}

export function QuickScheduleButton({
  task,
  workload,
  patterns,
  onSchedule,
  className,
}: QuickScheduleButtonProps) {
  const bestSuggestion = useMemo(() => {
    const suggestions = generateSuggestions(task, workload, patterns)
    return suggestions.find((s) => s.type === "optimal") || suggestions[0]
  }, [task, workload, patterns])

  if (!bestSuggestion) return null

  const formattedDate = bestSuggestion.date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <ClientTooltipProvider>
      <ClientTooltip>
        <ClientTooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSchedule(bestSuggestion.date, bestSuggestion.timeSlot)}
            className={cn("gap-2 text-green-600 hover:text-green-700 hover:bg-green-50", className)}
          >
            <Zap className="h-4 w-4" />
            {formattedDate}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </ClientTooltipTrigger>
        <ClientTooltipContent>
          <p className="font-medium">Best time to schedule</p>
          <p className="text-xs text-muted-foreground">{bestSuggestion.reason}</p>
        </ClientTooltipContent>
      </ClientTooltip>
    </ClientTooltipProvider>
  )
}

// ============ Hook ============
export function useSchedulingSuggestions(
  task: TaskContext,
  workload: WorkloadDay[],
  patterns: ProductivityPattern
) {
  return useMemo(
    () => generateSuggestions(task, workload, patterns),
    [task, workload, patterns]
  )
}
