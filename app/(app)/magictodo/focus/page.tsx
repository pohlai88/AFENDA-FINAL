/**
 * @domain magictodo
 * @layer ui
 * @responsibility UI route entrypoint for /app/magictodo/focus
 * Focus Mode page - Pomodoro-style task focus with queue management
 */

"use client"

import { useMemo, useCallback, useState, useEffect } from "react"
import { useUser } from "@/app/_components/user-context"
import { Alert, AlertDescription } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import { AlertCircle, Target, BarChart3, LoaderCircle } from "lucide-react"
import {
  FocusMode,
  FocusStats,
  useFocusSessionQuery,
  useFocusStreakQuery,
  useDailyFocusStatsQuery,
  useStartFocusSessionMutation,
  useEndFocusSessionMutation,
  usePauseFocusSessionMutation,
  useResumeFocusSessionMutation,
  useCompleteFocusTaskMutation,
  useSkipFocusTaskMutation,
  useTasksQuery,
  type TaskResponse,
} from "@afenda/magictodo"

export default function FocusPage() {
  // ============ ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ============
  
  // State for hydration-safe mounting
  const [isMounted, setIsMounted] = useState(false)
  
  const { user, isLoading, isAuthenticated } = useUser()

  // Focus queries
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useFocusSessionQuery()

  const { data: streak } = useFocusStreakQuery()
  const { data: todayStats } = useDailyFocusStatsQuery()

  // Get last 7 days for weekly stats
  const _weeklyDates = useMemo(() => {
    const dates: string[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split("T")[0]!)
    }
    return dates
  }, [])

  // Get available tasks for queue (incomplete tasks)
  const { data: tasksData } = useTasksQuery(
    { 
      status: { values: ["todo", "in_progress"], includeMode: "any" },
      sortBy: "dueDate",
      sortOrder: "asc",
    },
    { enabled: !!user?.id }
  )

  // Focus mutations
  const startMutation = useStartFocusSessionMutation()
  const endMutation = useEndFocusSessionMutation()
  const pauseMutation = usePauseFocusSessionMutation()
  const resumeMutation = useResumeFocusSessionMutation()
  const completeMutation = useCompleteFocusTaskMutation()
  const skipMutation = useSkipFocusTaskMutation()

  // Derive current and next tasks from session
  const { currentTask, nextTask, queueLength } = useMemo(() => {
    if (!session?.queue || session.queue.length === 0) {
      return { currentTask: null, nextTask: null, queueLength: 0 }
    }

    const queue = session.queue
    const tasks = tasksData?.items ?? []

    const current = tasks.find((t: TaskResponse) => t.id === queue[0]?.taskId)
    const next = queue.length > 1 ? tasks.find((t: TaskResponse) => t.id === queue[1]?.taskId) : null

    return {
      currentTask: current ?? null,
      nextTask: next ?? null,
      queueLength: queue.length,
    }
  }, [session?.queue, tasksData?.items])

  // Handlers
  const handleStart = useCallback(
    async (taskIds: string[]) => {
      await startMutation.mutateAsync({ taskIds })
    },
    [startMutation]
  )

  const handlePause = useCallback(async () => {
    if (session?.id) {
      await pauseMutation.mutateAsync({ sessionId: session.id })
    }
  }, [pauseMutation, session])

  const handleResume = useCallback(async () => {
    if (session?.id) {
      await resumeMutation.mutateAsync({ sessionId: session.id })
    }
  }, [resumeMutation, session])

  const handleComplete = useCallback(
    async (taskId: string) => {
      if (session?.id) {
        await completeMutation.mutateAsync({ sessionId: session.id, taskId })
      }
    },
    [completeMutation, session]
  )

  const handleSkip = useCallback(
    async (taskId: string) => {
      if (session?.id) {
        await skipMutation.mutateAsync({ sessionId: session.id, taskId })
      }
    },
    [skipMutation, session]
  )

  const handleEnd = useCallback(async () => {
    if (session?.id) {
      await endMutation.mutateAsync({ sessionId: session.id })
    }
  }, [endMutation, session])

  // Daily progress calculation
  const dailyProgress = useMemo(() => {
    return {
      completed: todayStats?.tasksCompleted ?? 0,
      goal: 5, // Default daily goal
    }
  }, [todayStats?.tasksCompleted])

  // Set mounted state after hydration (intentional one-off sync)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
    setIsMounted(true)
  }, [])

  // ============ CONDITIONAL RETURNS (all hooks must be called before this point) ============
  
  // Hydration-safe loading skeleton - renders same on server and client
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    )
  }

  // Auth loading/error states
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please sign in to use Focus Mode.</AlertDescription>
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

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="space-y-4 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load focus session. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="focus" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Focus Mode</h1>
            <p className="text-muted-foreground">
              Work through your tasks one at a time
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="focus" className="gap-2">
              <Target className="h-4 w-4" />
              Focus
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="focus" className="mt-0">
          <FocusMode
            session={session ?? null}
            currentTask={currentTask}
            nextTask={nextTask}
            queueLength={queueLength}
            streakDays={streak?.currentStreak ?? 0}
            dailyProgress={dailyProgress}
            isLoading={
              startMutation.isPending ||
              endMutation.isPending ||
              pauseMutation.isPending ||
              resumeMutation.isPending
            }
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onEnd={handleEnd}
            tasksForQueue={tasksData?.items ?? []}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          <div className="max-w-2xl mx-auto">
            <FocusStats
              streak={streak ?? null}
              todayStats={todayStats ?? null}
              weeklyStats={[]}
              dailyGoalMinutes={25 * 5} // 5 pomodoros of 25 minutes
            />

            {/* Session History */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Recent Sessions</CardTitle>
                <CardDescription>
                  Your focus session history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {session ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">Current Session</div>
                        <div className="text-sm text-muted-foreground">
                          {session.tasksCompleted ?? 0} tasks completed
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.status === "active" ? "In Progress" : "Paused"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active session. Start a focus session to see your history.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
