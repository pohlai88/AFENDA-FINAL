/**
 * FocusStats Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Display focus streak, daily progress, and weekly stats
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { Progress } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { cn } from "@afenda/shared/utils"
import { 
  Flame, 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle2,
  Calendar,
  Award,
} from "lucide-react"
import type { FocusStreak, DailyFocusStats } from "@afenda/magictodo/zod"

export interface FocusStatsProps {
  streak: FocusStreak | null
  todayStats: DailyFocusStats | null
  weeklyStats?: DailyFocusStats[]
  dailyGoalMinutes?: number
  className?: string
}

// Format minutes to human readable
function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

// Get day abbreviation
function getDayAbbrev(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)
}

export function FocusStats({
  streak,
  todayStats,
  weeklyStats = [],
  dailyGoalMinutes = 60,
  className,
}: FocusStatsProps) {
  const currentStreak = streak?.currentStreak ?? 0
  const longestStreak = streak?.longestStreak ?? 0
  const todayMinutes = todayStats?.focusMinutes ?? 0
  const todayTasks = todayStats?.tasksCompleted ?? 0
  const todaySessions = todayStats?.sessionsCount ?? 0
  const goalProgress = Math.min((todayMinutes / dailyGoalMinutes) * 100, 100)
  const goalMet = todayStats?.goalMet ?? false

  // Calculate weekly totals
  const weeklyMinutes = weeklyStats.reduce((sum, day) => sum + (day.focusMinutes ?? 0), 0)
  const weeklyTasks = weeklyStats.reduce((sum, day) => sum + (day.tasksCompleted ?? 0), 0)

  return (
    <div className={cn("grid gap-4", className)}>
      {/* Streak Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Focus Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-4xl font-bold",
                  currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
                )}>
                  {currentStreak}
                </span>
                <span className="text-muted-foreground">days</span>
              </div>
              {currentStreak > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Keep it up! 🔥
                </p>
              )}
            </div>
            <div className="flex-1 text-right">
              <div className="text-sm text-muted-foreground">Best streak</div>
              <div className="flex items-center justify-end gap-1">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">{longestStreak} days</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Today&apos;s Focus
            {goalMet && (
              <Badge variant="default" className="ml-auto bg-green-500">
                Goal Met! 🎉
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Goal progress bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Daily goal</span>
                <span className="font-medium">
                  {formatMinutes(todayMinutes)} / {formatMinutes(dailyGoalMinutes)}
                </span>
              </div>
              <Progress 
                value={goalProgress} 
                className={cn(
                  "h-3",
                  goalMet && "[&>div]:bg-green-500"
                )}
              />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <div className="font-semibold">{formatMinutes(todayMinutes)}</div>
                <div className="text-xs text-muted-foreground">Focused</div>
              </div>
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <div className="font-semibold">{todayTasks}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <div className="font-semibold">{todaySessions}</div>
                <div className="text-xs text-muted-foreground">Sessions</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      {weeklyStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              This Week
            </CardTitle>
            <CardDescription>
              {formatMinutes(weeklyMinutes)} focused · {weeklyTasks} tasks completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Weekly bar chart */}
            <div className="flex items-end justify-between gap-1 h-24">
              {weeklyStats.map((day) => {
                const heightPercent = dailyGoalMinutes > 0 
                  ? Math.min((day.focusMinutes / dailyGoalMinutes) * 100, 100)
                  : 0
                const isToday = new Date(day.date).toDateString() === new Date().toDateString()
                
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="relative w-full h-20 flex items-end justify-center">
                      <div
                        className={cn(
                          "w-full max-w-8 rounded-t transition-all",
                          day.goalMet 
                            ? "bg-green-500" 
                            : isToday 
                              ? "bg-primary" 
                              : "bg-muted-foreground/30"
                        )}
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs",
                      isToday ? "font-semibold" : "text-muted-foreground"
                    )}>
                      {getDayAbbrev(day.date)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Goal met</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-muted-foreground/30" />
                <span>Other days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All-time stats */}
      {streak && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">All-Time Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {formatMinutes(streak.totalFocusMinutes ?? 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total focus time</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{streak.totalTasksCompleted ?? 0}</div>
                <div className="text-sm text-muted-foreground">Tasks completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
