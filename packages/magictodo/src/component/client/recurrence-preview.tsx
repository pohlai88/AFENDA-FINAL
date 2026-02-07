/**
 * @domain magictodo
 * @layer ui
 * @responsibility Preview next occurrences of recurring tasks
 * Recurrence Preview - Shows upcoming instances of recurring tasks
 */

"use client"

import { useMemo } from "react"
import { Badge } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
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
  Repeat,
  Calendar,
  Clock,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Info,
  AlertCircle,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"

// ============ Types ============
/** UI-only recurrence types (use zod types from @afenda/magictodo/zod for API contracts) */
export type RecurrencePreviewFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "custom"

export interface RecurrencePreviewRule {
  frequency: RecurrencePreviewFrequency
  interval: number // Every X days/weeks/months
  daysOfWeek?: number[] // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  monthOfYear?: number // 0-11 for yearly
  endDate?: Date
  occurrenceCount?: number // Max occurrences
  excludeDates?: Date[] // Skip these dates
}

export interface RecurrenceOccurrence {
  date: Date
  isHoliday?: boolean
  isWeekend?: boolean
  conflictsWith?: string[] // Task names that conflict
  note?: string
}

// ============ Occurrence Generation ============
function generateOccurrences(
  startDate: Date,
  rule: RecurrencePreviewRule,
  count: number = 5
): RecurrenceOccurrence[] {
  const occurrences: RecurrenceOccurrence[] = []
  const maxIterations = 365 // Safety limit
  let iterations = 0
  const currentDate = new Date(startDate)

  // Move to next occurrence after start date
  currentDate.setDate(currentDate.getDate() + 1)

  while (occurrences.length < count && iterations < maxIterations) {
    iterations++

    let isOccurrence = false

    switch (rule.frequency) {
      case "daily":
        isOccurrence = true
        break

      case "weekly":
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          isOccurrence = rule.daysOfWeek.includes(currentDate.getDay())
        } else {
          isOccurrence = currentDate.getDay() === startDate.getDay()
        }
        break

      case "biweekly":
        const weeksDiff = Math.floor(
          (currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        )
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          isOccurrence = weeksDiff % 2 === 0 && rule.daysOfWeek.includes(currentDate.getDay())
        } else {
          isOccurrence = weeksDiff % 2 === 0 && currentDate.getDay() === startDate.getDay()
        }
        break

      case "monthly":
        const targetDay = rule.dayOfMonth ?? startDate.getDate()
        isOccurrence = currentDate.getDate() === targetDay
        break

      case "yearly":
        const targetMonth = rule.monthOfYear ?? startDate.getMonth()
        const targetDayOfMonth = rule.dayOfMonth ?? startDate.getDate()
        isOccurrence =
          currentDate.getMonth() === targetMonth &&
          currentDate.getDate() === targetDayOfMonth
        break

      case "custom":
        // Custom interval in days
        const daysDiff = Math.floor(
          (currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
        )
        isOccurrence = daysDiff % rule.interval === 0
        break
    }

    // Check if date is excluded
    if (isOccurrence && rule.excludeDates) {
      const isExcluded = rule.excludeDates.some(
        (d) => d.toDateString() === currentDate.toDateString()
      )
      if (isExcluded) isOccurrence = false
    }

    // Check end conditions
    if (rule.endDate && currentDate > rule.endDate) {
      break
    }

    if (rule.occurrenceCount && occurrences.length >= rule.occurrenceCount) {
      break
    }

    if (isOccurrence) {
      const dayOfWeek = currentDate.getDay()
      occurrences.push({
        date: new Date(currentDate),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      })
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return occurrences
}

function describeRecurrence(rule: RecurrencePreviewRule): string {
  const intervalText = rule.interval > 1 ? `every ${rule.interval} ` : "every "

  switch (rule.frequency) {
    case "daily":
      return rule.interval === 1 ? "Daily" : `Every ${rule.interval} days`

    case "weekly":
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const days = rule.daysOfWeek.map((d) => dayNames[d]).join(", ")
        return `Weekly on ${days}`
      }
      return "Weekly"

    case "biweekly":
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const days = rule.daysOfWeek.map((d) => dayNames[d]).join(", ")
        return `Bi-weekly on ${days}`
      }
      return "Bi-weekly"

    case "monthly":
      if (rule.dayOfMonth) {
        return `Monthly on the ${ordinal(rule.dayOfMonth)}`
      }
      return "Monthly"

    case "yearly":
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ]
      if (rule.monthOfYear !== undefined && rule.dayOfMonth) {
        return `Yearly on ${monthNames[rule.monthOfYear]} ${rule.dayOfMonth}`
      }
      return "Yearly"

    case "custom":
      return `Every ${rule.interval} days`

    default:
      return "Recurring"
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])!
}

function getFrequencyIcon(frequency: RecurrencePreviewFrequency) {
  switch (frequency) {
    case "daily":
      return Calendar
    case "weekly":
    case "biweekly":
      return CalendarDays
    case "monthly":
    case "yearly":
      return CalendarRange
    default:
      return Repeat
  }
}

// ============ Occurrence Item Component ============
interface OccurrenceItemProps {
  occurrence: RecurrenceOccurrence
  index: number
}

function OccurrenceItem({ occurrence, index }: OccurrenceItemProps) {
  const isFirst = index === 0
  const dayName = occurrence.date.toLocaleDateString(undefined, { weekday: "short" })
  const dateStr = occurrence.date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })

  const daysUntil = Math.ceil(
    (occurrence.date.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)
  )

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors",
        isFirst ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
          isFirst ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {index + 1}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{dayName}</span>
          <span className="text-muted-foreground">{dateStr}</span>
          {occurrence.isWeekend && (
            <Badge variant="outline" className="text-xs">
              Weekend
            </Badge>
          )}
          {occurrence.isHoliday && (
            <Badge variant="outline" className="text-xs bg-yellow-100">
              Holiday
            </Badge>
          )}
        </div>
        {occurrence.note && (
          <p className="text-xs text-muted-foreground mt-0.5">{occurrence.note}</p>
        )}
      </div>

      <div className="text-right">
        <span className="text-sm text-muted-foreground">
          {daysUntil === 0
            ? "Today"
            : daysUntil === 1
            ? "Tomorrow"
            : `${daysUntil} days`}
        </span>
      </div>
    </div>
  )
}

// ============ Main Component ============
interface RecurrencePreviewProps {
  startDate: Date
  rule: RecurrencePreviewRule
  previewCount?: number
  className?: string
  variant?: "inline" | "popover" | "card"
  showDescription?: boolean
}

export function RecurrencePreview({
  startDate,
  rule,
  previewCount = 5,
  className,
  variant = "card",
  showDescription = true,
}: RecurrencePreviewProps) {
  const occurrences = useMemo(
    () => generateOccurrences(startDate, rule, previewCount),
    [startDate, rule, previewCount]
  )

  const description = useMemo(() => describeRecurrence(rule), [rule])
  const FrequencyIcon = getFrequencyIcon(rule.frequency)

  const content = (
    <div className="space-y-1">
      {occurrences.map((occurrence, index) => (
        <OccurrenceItem key={index} occurrence={occurrence} index={index} />
      ))}
      {occurrences.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <AlertCircle className="h-5 w-5 mx-auto mb-1" />
          <p className="text-sm">No upcoming occurrences</p>
        </div>
      )}
    </div>
  )

  if (variant === "inline") {
    return (
      <div className={className}>
        {showDescription && (
          <div className="flex items-center gap-2 mb-3">
            <FrequencyIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{description}</span>
          </div>
        )}
        {content}
      </div>
    )
  }

  if (variant === "popover") {
    return (
      <ClientPopover>
        <ClientPopoverTrigger asChild>
          <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
            <Repeat className="h-4 w-4" />
            {description}
            <ChevronRight className="h-3 w-3" />
          </Button>
        </ClientPopoverTrigger>
        <ClientPopoverContent align="start" className="w-80 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FrequencyIcon className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Upcoming Occurrences</h4>
            </div>
            {content}
            {rule.endDate && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                Ends {rule.endDate.toLocaleDateString()}
              </p>
            )}
            {rule.occurrenceCount && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                {rule.occurrenceCount} total occurrences
              </p>
            )}
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
          <FrequencyIcon className="h-4 w-4 text-primary" />
          Recurrence Preview
          <Badge variant="outline" className="ml-auto">
            {description}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {content}
        {(rule.endDate || rule.occurrenceCount) && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center gap-2">
            <Info className="h-3 w-3" />
            {rule.endDate && <span>Ends {rule.endDate.toLocaleDateString()}</span>}
            {rule.occurrenceCount && (
              <span>
                {rule.occurrenceCount} total occurrence{rule.occurrenceCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ Compact Badge Component ============
interface RecurrenceBadgeProps {
  rule: RecurrencePreviewRule
  startDate: Date
  className?: string
}

export function RecurrenceBadge({ rule, startDate, className }: RecurrenceBadgeProps) {
  const description = useMemo(() => describeRecurrence(rule), [rule])
  const occurrences = useMemo(
    () => generateOccurrences(startDate, rule, 3),
    [startDate, rule]
  )

  const nextDate = occurrences[0]?.date

  return (
    <ClientTooltipProvider>
      <ClientTooltip>
        <ClientTooltipTrigger asChild>
          <Badge variant="outline" className={cn("gap-1 cursor-default", className)}>
            <Repeat className="h-3 w-3" />
            {description}
          </Badge>
        </ClientTooltipTrigger>
        <ClientTooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium mb-1">Next occurrences:</p>
          <ul className="text-xs space-y-0.5">
            {occurrences.map((occ, i) => (
              <li key={i} className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {occ.date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </li>
            ))}
          </ul>
        </ClientTooltipContent>
      </ClientTooltip>
    </ClientTooltipProvider>
  )
}

// ============ Next Occurrence Component ============
interface NextOccurrenceProps {
  rule: RecurrencePreviewRule
  startDate: Date
  className?: string
}

export function NextOccurrence({ rule, startDate, className }: NextOccurrenceProps) {
  const occurrences = useMemo(
    () => generateOccurrences(startDate, rule, 1),
    [startDate, rule]
  )

  const next = occurrences[0]
  if (!next) return null

  const daysUntil = Math.ceil(
    (next.date.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)
  )

  const dateStr = next.date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span>Next: {dateStr}</span>
      <span className="text-muted-foreground">
        ({daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`})
      </span>
    </div>
  )
}

// ============ Hook ============
export function useRecurrencePreview(startDate: Date, rule: RecurrencePreviewRule, count: number = 5) {
  return useMemo(() => {
    const occurrences = generateOccurrences(startDate, rule, count)
    const description = describeRecurrence(rule)

    return {
      occurrences,
      description,
      nextOccurrence: occurrences[0] || null,
      hasWeekendOccurrences: occurrences.some((o) => o.isWeekend),
      totalInNext30Days: occurrences.filter(
        (o) => o.date.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
      ).length,
    }
  }, [startDate, rule, count])
}
