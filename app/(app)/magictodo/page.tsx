/**
 * @domain magictodo
 * @layer ui
 * @responsibility MagicTodo landing page dashboard with stats, quick actions, and view navigation
 */

"use client"

import Link from "next/link"
import { useMemo } from "react"
import { routes } from "@afenda/shared/constants"
import { useUser } from "@/app/_components/user-context"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Progress } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import {
  ListTodo,
  Kanban,
  Calendar,
  Table2,
  GanttChart,
  Target,
  GitBranch,
  FolderKanban,
  Clock,
  AlertTriangle,
  Flame,
  Plus,
  ArrowRight,
  Bell,
  TrendingUp,
  Zap,
} from "lucide-react"
import {
  useTasksQuery,
  useProjectsQuery,
  useFocusStreakQuery,
  useSnoozedTasksQuery,
} from "@afenda/magictodo"

// View cards data
const viewCards = [
  {
    title: "List View",
    description: "Classic task list with rich indicators",
    href: routes.ui.magictodo.tasks(),
    icon: ListTodo,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Kanban Board",
    description: "Drag-and-drop columns by status",
    href: routes.ui.magictodo.kanban(),
    icon: Kanban,
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Calendar",
    description: "Month/week/day timeline view",
    href: routes.ui.magictodo.calendar(),
    icon: Calendar,
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Table",
    description: "Excel-like with inline editing",
    href: routes.ui.magictodo.table(),
    icon: Table2,
    color: "bg-orange-500/10 text-orange-500",
  },
  {
    title: "Gantt Chart",
    description: "Timeline with dependencies",
    href: routes.ui.magictodo.gantt(),
    icon: GanttChart,
    color: "bg-red-500/10 text-red-500",
  },
  {
    title: "Focus Mode",
    description: "Distraction-free task queue",
    href: routes.ui.magictodo.focus(),
    icon: Target,
    color: "bg-yellow-500/10 text-yellow-500",
  },
  {
    title: "Hierarchy",
    description: "Parent-child task tree",
    href: routes.ui.magictodo.hierarchy(),
    icon: GitBranch,
    color: "bg-cyan-500/10 text-cyan-500",
  },
  {
    title: "Projects",
    description: "Organize tasks by project",
    href: routes.ui.magictodo.projects(),
    icon: FolderKanban,
    color: "bg-pink-500/10 text-pink-500",
  },
]

export default function MagictodoDashboard() {
  const { isAuthenticated: _isAuthenticated } = useUser()

  // Fetch data
  const { data: tasksData, isLoading: tasksLoading } = useTasksQuery()
  const { data: projectsData, isLoading: projectsLoading } = useProjectsQuery()
  const { data: streakData, isLoading: streakLoading } = useFocusStreakQuery()
  const { data: snoozedData, isLoading: _snoozedLoading } = useSnoozedTasksQuery()

  // Compute stats
  const stats = useMemo(() => {
    const tasks = tasksData?.items ?? []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const total = tasks.length
    const completed = tasks.filter((t) => t.status === "done").length
    const inProgress = tasks.filter((t) => t.status === "in_progress").length
    const todo = tasks.filter((t) => t.status === "todo").length

    const overdue = tasks.filter((t) => {
      if (t.status === "done" || t.status === "cancelled") return false
      if (!t.dueDate) return false
      return new Date(t.dueDate) < now
    }).length

    const dueToday = tasks.filter((t) => {
      if (t.status === "done" || t.status === "cancelled") return false
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return due >= today && due < tomorrow
    }).length

    const dueThisWeek = tasks.filter((t) => {
      if (t.status === "done" || t.status === "cancelled") return false
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return due >= today && due < weekEnd
    }).length

    const highPriority = tasks.filter(
      (t) =>
        (t.priority === "high" || t.priority === "urgent") &&
        t.status !== "done" &&
        t.status !== "cancelled"
    ).length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      inProgress,
      todo,
      overdue,
      dueToday,
      dueThisWeek,
      highPriority,
      completionRate,
    }
  }, [tasksData])

  const projectCount = projectsData?.items?.length ?? 0
  const snoozedCount = snoozedData?.items?.length ?? 0
  const currentStreak = streakData?.currentStreak ?? 0

  const isLoading = tasksLoading || projectsLoading

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MagicTodo</h1>
          <p className="text-muted-foreground">
            Intelligent task management with multiple views
          </p>
        </div>
        <Button asChild>
          <Link href={routes.ui.magictodo.tasks()}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats.completed} completed, {stats.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.dueToday}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats.dueThisWeek} due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {stats.overdue}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats.highPriority} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {streakLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{currentStreak} days</div>
            )}
            <p className="text-xs text-muted-foreground">Keep it going!</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Overview
          </CardTitle>
          <CardDescription>Your task completion rate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Completion Rate</span>
            <span className="text-sm text-muted-foreground">
              {stats.completionRate}%
            </span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Done: {stats.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>In Progress: {stats.inProgress}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
              <span>Todo: {stats.todo}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href={routes.ui.magictodo.focus()}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-yellow-500/10 p-3">
                <Target className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-semibold">Start Focus Session</h3>
                <p className="text-sm text-muted-foreground">
                  Deep work mode
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href={routes.ui.magictodo.tasks()}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-orange-500/10 p-3">
                <Bell className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">Snoozed Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  {snoozedCount} waiting
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href={routes.ui.magictodo.projects()}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-pink-500/10 p-3">
                <FolderKanban className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <h3 className="font-semibold">Projects</h3>
                <p className="text-sm text-muted-foreground">
                  {projectCount} active
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href={routes.ui.magictodo.kanban()}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Kanban</h3>
                <p className="text-sm text-muted-foreground">
                  Drag & drop view
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* View Cards */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Choose Your View</h2>
          <Badge variant="secondary">8 Views Available</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {viewCards.map((view) => {
            const Icon = view.icon
            return (
              <Card
                key={view.href}
                className="group cursor-pointer transition-all hover:shadow-md"
              >
                <Link href={view.href}>
                  <CardHeader className="pb-2">
                    <div
                      className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg ${view.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="flex items-center justify-between text-base">
                      {view.title}
                      <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {view.description}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
