/**
 * SnoozeMenu Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Dropdown menu for snoozing tasks with presets
 */

"use client"

import { useState } from "react"
import { Button } from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuLabel,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
} from "@afenda/shadcn"
import { Calendar } from "@afenda/shadcn"
import { cn } from "@afenda/shared/utils"
import { 
  Clock, 
  Moon, 
  Sun, 
  CalendarDays, 
  Calendar as CalendarIcon,
  BellOff,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import type { TaskSnooze, SnoozePreset } from "@afenda/magictodo/zod"
import { SNOOZE_PRESET, SNOOZE_TYPE } from "@afenda/magictodo/zod"

export interface SnoozeMenuProps {
  taskId: string
  currentSnooze?: TaskSnooze | null
  isLoading?: boolean
  onSnooze: (preset: SnoozePreset, customDate?: Date) => Promise<void>
  onUnsnooze: () => Promise<void>
  onSnoozeUntilTask?: (taskId: string) => Promise<void>
  availableTasks?: { id: string; title: string }[]
  disabled?: boolean
}

const PRESET_OPTIONS = [
  {
    preset: SNOOZE_PRESET.LATER_TODAY,
    label: "Later today",
    description: "In 3 hours",
    icon: Clock,
  },
  {
    preset: SNOOZE_PRESET.TONIGHT,
    label: "Tonight",
    description: "7:00 PM",
    icon: Moon,
  },
  {
    preset: SNOOZE_PRESET.TOMORROW_MORNING,
    label: "Tomorrow morning",
    description: "9:00 AM",
    icon: Sun,
  },
  {
    preset: SNOOZE_PRESET.TOMORROW_AFTERNOON,
    label: "Tomorrow afternoon",
    description: "2:00 PM",
    icon: Sun,
  },
  {
    preset: SNOOZE_PRESET.NEXT_WEEK,
    label: "Next week",
    description: "Monday 9:00 AM",
    icon: CalendarDays,
  },
  {
    preset: SNOOZE_PRESET.NEXT_WEEKEND,
    label: "Next weekend",
    description: "Saturday 10:00 AM",
    icon: CalendarIcon,
  },
] as const

function formatSnoozeUntil(snoozedUntil: string): string {
  const date = new Date(snoozedUntil)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  
  if (diffMs < 0) return "Expired"
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffHours < 1) return "In less than an hour"
  if (diffHours < 24) return `In ${diffHours} hour${diffHours > 1 ? "s" : ""}`
  if (diffDays === 1) return "Tomorrow"
  if (diffDays < 7) return `In ${diffDays} days`
  
  return date.toLocaleDateString(undefined, { 
    weekday: "short", 
    month: "short", 
    day: "numeric" 
  })
}

export function SnoozeMenu({
  taskId: _taskId,
  currentSnooze,
  isLoading = false,
  onSnooze,
  onUnsnooze,
  onSnoozeUntilTask,
  availableTasks = [],
  disabled = false,
}: SnoozeMenuProps) {
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  
  const isSnoozed = !!currentSnooze

  const handlePresetClick = async (preset: SnoozePreset) => {
    setIsActionLoading(true)
    try {
      await onSnooze(preset)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCustomDateSelect = async (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    setIsActionLoading(true)
    try {
      await onSnooze(SNOOZE_PRESET.CUSTOM, date)
      setShowCustomDate(false)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUnsnooze = async () => {
    setIsActionLoading(true)
    try {
      await onUnsnooze()
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSnoozeUntilTask = async (taskId: string) => {
    if (!onSnoozeUntilTask) return
    setIsActionLoading(true)
    try {
      await onSnoozeUntilTask(taskId)
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  // Show unsnooze button if already snoozed
  if (isSnoozed) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <BellOff className="h-4 w-4" />
          <span>
            {currentSnooze.snoozedUntil 
              ? formatSnoozeUntil(currentSnooze.snoozedUntil)
              : currentSnooze.snoozedUntilTaskId
                ? "Until task completes"
                : "Snoozed"
            }
          </span>
          {currentSnooze.snoozeCount > 1 && (
            <span className="text-xs text-muted-foreground/70">
              (×{currentSnooze.snoozeCount})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnsnooze}
          disabled={isActionLoading || disabled}
        >
          {isActionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Unsnooze"
          )}
        </Button>
      </div>
    )
  }

  return (
    <ClientDropdownMenu>
      <ClientDropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          disabled={isActionLoading || disabled}
        >
          {isActionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <BellOff className="h-4 w-4 mr-1" />
              Snooze
            </>
          )}
        </Button>
      </ClientDropdownMenuTrigger>
      <ClientDropdownMenuContent align="end" className="w-56">
        <ClientDropdownMenuLabel>Snooze until</ClientDropdownMenuLabel>
        <ClientDropdownMenuSeparator />
        
        {PRESET_OPTIONS.map((option) => (
          <ClientDropdownMenuItem
            key={option.preset}
            onClick={() => handlePresetClick(option.preset)}
            className="flex items-center gap-2"
          >
            <option.icon className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div>{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </div>
          </ClientDropdownMenuItem>
        ))}
        
        <ClientDropdownMenuSeparator />
        
        <ClientPopover open={showCustomDate} onOpenChange={setShowCustomDate}>
          <ClientPopoverTrigger asChild>
            <ClientDropdownMenuItem 
              onSelect={(e) => e.preventDefault()}
              onClick={() => setShowCustomDate(true)}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>Pick date & time...</span>
            </ClientDropdownMenuItem>
          </ClientPopoverTrigger>
          <ClientPopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCustomDateSelect}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </ClientPopoverContent>
        </ClientPopover>
        
        {availableTasks.length > 0 && onSnoozeUntilTask && (
          <>
            <ClientDropdownMenuSeparator />
            <ClientDropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Until task completes
            </ClientDropdownMenuLabel>
            {availableTasks.slice(0, 5).map((task) => (
              <ClientDropdownMenuItem
                key={task.id}
                onClick={() => handleSnoozeUntilTask(task.id)}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{task.title}</span>
              </ClientDropdownMenuItem>
            ))}
          </>
        )}
      </ClientDropdownMenuContent>
    </ClientDropdownMenu>
  )
}
