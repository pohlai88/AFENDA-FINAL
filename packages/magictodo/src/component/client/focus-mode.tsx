/**
 * FocusMode Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Full-screen single-task focus mode with queue
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@afenda/shadcn"
import { Progress } from "@afenda/shadcn"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { cn } from "@afenda/shared/utils"
import { 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle2, 
  X, 
  Timer,
  Flame,
  Target,
  ChevronRight,
  Loader2,
} from "lucide-react"
import type { FocusSession, TaskResponse, FocusQueueItem } from "@afenda/magictodo/zod"

export interface FocusModeProps {
  session: FocusSession | null
  currentTask?: TaskResponse | null
  nextTask?: TaskResponse | null
  queueLength: number
  streakDays: number
  dailyProgress: { completed: number; goal: number }
  isLoading?: boolean
  onStart: (taskIds: string[]) => Promise<void>
  onPause: () => Promise<void>
  onResume: () => Promise<void>
  onComplete: (taskId: string) => Promise<void>
  onSkip: (taskId: string) => Promise<void>
  onEnd: () => Promise<void>
  tasksForQueue?: TaskResponse[]
}

// Format seconds to mm:ss or hh:mm:ss
function formatTimer(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  const pad = (n: number) => n.toString().padStart(2, "0")
  
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`
  }
  return `${pad(minutes)}:${pad(secs)}`
}

export function FocusMode({
  session,
  currentTask,
  nextTask,
  queueLength,
  streakDays,
  dailyProgress,
  isLoading = false,
  onStart,
  onPause,
  onResume,
  onComplete,
  onSkip,
  onEnd,
  tasksForQueue = [],
}: FocusModeProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  const isActive = session?.status === "active"
  const isPaused = session?.status === "paused"
  const hasSession = !!session && (isActive || isPaused)

  // Timer effect
  useEffect(() => {
    if (!isActive || !session?.startedAt) {
      return
    }

    const startTime = new Date(session.startedAt).getTime()
    const baseTime = session.totalFocusTime ?? 0

    const updateElapsed = () => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000) + baseTime
      setElapsedSeconds(elapsed)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [isActive, session?.startedAt, session?.totalFocusTime])

  // Reset elapsed when session changes
  useEffect(() => {
    if (!session) {
      setElapsedSeconds(0)
    }
  }, [session])

  const handleAction = useCallback(async (action: () => Promise<void>) => {
    setIsActionLoading(true)
    try {
      await action()
    } finally {
      setIsActionLoading(false)
    }
  }, [])

  const handleStart = () => handleAction(() => onStart(selectedTaskIds))
  const handlePause = () => handleAction(onPause)
  const handleResume = () => handleAction(onResume)
  const handleComplete = () => currentTask && handleAction(() => onComplete(currentTask.id))
  const handleSkip = () => currentTask && handleAction(() => onSkip(currentTask.id))
  const handleEnd = () => handleAction(onEnd)

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => 
      prev.includes(taskId) 
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    )
  }

  // No active session - show start screen
  if (!hasSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Focus Mode</h2>
          <p className="text-muted-foreground max-w-md">
            Work through your tasks one at a time. Stay focused, complete more.
          </p>
        </div>

        {/* Streak display */}
        {streakDays > 0 && (
          <div className="flex items-center gap-2 mb-6 px-4 py-2 bg-orange-500/10 rounded-full">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-semibold text-orange-600">
              {streakDays} day streak!
            </span>
          </div>
        )}

        {/* Task selection */}
        <Card className="w-full max-w-md mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select tasks to focus on</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto">
            {tasksForQueue.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tasks available</p>
            ) : (
              <div className="space-y-2">
                {tasksForQueue.map((task, index) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskSelection(task.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      selectedTaskIds.includes(task.id)
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <span className="text-sm text-muted-foreground w-6">
                      {selectedTaskIds.includes(task.id) 
                        ? selectedTaskIds.indexOf(task.id) + 1 
                        : ""}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{task.title}</div>
                      {task.priority && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    {selectedTaskIds.includes(task.id) && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStart}
              disabled={selectedTaskIds.length === 0 || isActionLoading || isLoading}
              className="w-full"
              size="lg"
            >
              {isActionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              Start Focus Session ({selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? "s" : ""})
            </Button>
          </CardFooter>
        </Card>

        {/* Daily progress */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Today&apos;s progress: {dailyProgress.completed} / {dailyProgress.goal} tasks
          </p>
          <Progress 
            value={(dailyProgress.completed / dailyProgress.goal) * 100} 
            className="w-48 h-2"
          />
        </div>
      </div>
    )
  }

  // Active session - show focus view
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      {/* Header with timer and controls */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-mono font-bold">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
          {streakDays > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-full">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600">{streakDays}</span>
            </div>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleEnd}
          disabled={isActionLoading}
        >
          <X className="h-4 w-4 mr-1" />
          End Session
        </Button>
      </div>

      {/* Current task card */}
      <Card className="w-full max-w-2xl mb-8 border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="text-sm text-muted-foreground mb-2">
            Task {(session?.tasksCompleted ?? 0) + 1} of {queueLength + (session?.tasksCompleted ?? 0)}
          </div>
          <CardTitle className="text-2xl">
            {currentTask?.title ?? "No task"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center pb-8">
          {currentTask?.description && (
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {currentTask.description}
            </p>
          )}
          <div className="flex items-center justify-center gap-2">
            {currentTask?.priority && (
              <Badge variant="outline">{currentTask.priority}</Badge>
            )}
            {currentTask?.dueDate && (
              <Badge variant="outline">
                Due: {new Date(currentTask.dueDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 pt-4 border-t">
          {/* Pause/Resume */}
          {isActive ? (
            <Button
              variant="outline"
              size="lg"
              onClick={handlePause}
              disabled={isActionLoading}
            >
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={handleResume}
              disabled={isActionLoading}
            >
              <Play className="h-5 w-5 mr-2" />
              Resume
            </Button>
          )}
          
          {/* Skip */}
          <Button
            variant="ghost"
            size="lg"
            onClick={handleSkip}
            disabled={isActionLoading || !currentTask}
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Skip
          </Button>
          
          {/* Complete */}
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={isActionLoading || !currentTask}
            className="bg-green-600 hover:bg-green-700"
          >
            {isActionLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-5 w-5 mr-2" />
            )}
            Complete
          </Button>
        </CardFooter>
      </Card>

      {/* Next up */}
      {nextTask && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="text-sm">Up next:</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium">{nextTask.title}</span>
          </div>
        </div>
      )}

      {/* Session stats */}
      <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
        <div>
          <span className="font-semibold text-foreground">{session?.tasksCompleted ?? 0}</span> completed
        </div>
        <div>
          <span className="font-semibold text-foreground">{session?.tasksSkipped ?? 0}</span> skipped
        </div>
        <div>
          <span className="font-semibold text-foreground">{session?.breaks ?? 0}</span> breaks
        </div>
      </div>
    </div>
  )
}
