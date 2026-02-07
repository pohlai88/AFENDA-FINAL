/**
 * TimeTracker Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Display and control time tracking for a task
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@afenda/shadcn"
import { cn } from "@afenda/shared/utils"
import { Play, Pause, Clock, Timer, Loader2 } from "lucide-react"
import type { TimeEntry } from "@afenda/magictodo/zod"

export interface TimeTrackerProps {
  taskId: string
  activeEntry?: TimeEntry
  totalTimeSpent?: number // seconds
  entries?: TimeEntry[]
  isLoading?: boolean
  onStartTimer?: () => Promise<void>
  onStopTimer?: (entryId: string) => Promise<void>
  readonly?: boolean
}

// Format duration in seconds to human-readable string
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m ${secs}s`
}

// Format duration for the running timer display
function formatTimerDisplay(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  const pad = (n: number) => n.toString().padStart(2, "0")
  
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`
  }
  return `${pad(minutes)}:${pad(secs)}`
}

export function TimeTracker({
  taskId: _taskId,
  activeEntry,
  totalTimeSpent = 0,
  entries = [],
  isLoading = false,
  onStartTimer,
  onStopTimer,
  readonly = false,
}: TimeTrackerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  const isRunning = !!activeEntry

  // Calculate elapsed time for active entry
  useEffect(() => {
    if (!activeEntry?.startTime) {
      setElapsedSeconds(0)
      return
    }

    const startTime = new Date(activeEntry.startTime).getTime()
    
    const updateElapsed = () => {
      const now = Date.now()
      setElapsedSeconds(Math.floor((now - startTime) / 1000))
    }
    
    updateElapsed() // Initial update
    const interval = setInterval(updateElapsed, 1000)
    
    return () => clearInterval(interval)
  }, [activeEntry?.startTime])

  const handleToggleTimer = useCallback(async () => {
    setIsActionLoading(true)
    try {
      if (isRunning && activeEntry) {
        await onStopTimer?.(activeEntry.id)
      } else {
        await onStartTimer?.()
      }
    } finally {
      setIsActionLoading(false)
    }
  }, [isRunning, activeEntry, onStartTimer, onStopTimer])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading time data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Timer display and control */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Timer icon and display */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md",
            isRunning ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          )}>
            <Timer className={cn(
              "h-4 w-4",
              isRunning && "animate-pulse"
            )} />
            <span className={cn(
              "font-mono text-sm font-medium",
              isRunning && "tabular-nums"
            )}>
              {isRunning ? formatTimerDisplay(elapsedSeconds) : "00:00"}
            </span>
          </div>
          
          {/* Total time */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">
              Total: {formatDuration(totalTimeSpent + (isRunning ? elapsedSeconds : 0))}
            </span>
          </div>
        </div>

        {/* Start/Stop button */}
        {!readonly && (onStartTimer || onStopTimer) && (
          <Button
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={handleToggleTimer}
            disabled={isActionLoading}
            className="gap-1.5"
          >
            {isActionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
        )}
      </div>

      {/* Recent time entries (optional) */}
      {entries.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Recent Sessions</p>
          <ul className="space-y-1">
            {entries.slice(0, 5).map((entry) => {
              const duration = entry.duration ?? 0
              const date = new Date(entry.startTime)
              
              return (
                <li 
                  key={entry.id}
                  className="flex items-center justify-between text-xs text-muted-foreground px-2 py-1 rounded bg-muted/30"
                >
                  <span>{date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  <span className="font-mono">{formatDuration(duration)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
