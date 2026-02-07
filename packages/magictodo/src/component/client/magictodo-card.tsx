/**
 * MagicTodo Task Card Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Displays a single task with actions and indicators
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@afenda/shadcn"
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  ListTodo, 
  Timer, 
  MessageSquare, 
  Paperclip, 
  Link2,
  BellOff,
} from "lucide-react"
import type { TaskResponse, TaskStatus, TaskPriority } from "@afenda/magictodo/zod"
import { TASK_STATUS, TASK_PRIORITY } from "@afenda/magictodo/zod"

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  [TASK_STATUS.TODO]: <Circle className="h-4 w-4 text-muted-foreground" />,
  [TASK_STATUS.IN_PROGRESS]: <Clock className="h-4 w-4 text-blue-500" />,
  [TASK_STATUS.DONE]: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  [TASK_STATUS.CANCELLED]: <AlertCircle className="h-4 w-4 text-gray-400" />,
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.LOW]: "bg-gray-100 text-gray-700",
  [TASK_PRIORITY.MEDIUM]: "bg-blue-100 text-blue-700",
  [TASK_PRIORITY.HIGH]: "bg-orange-100 text-orange-700",
  [TASK_PRIORITY.URGENT]: "bg-red-100 text-red-700",
}

/**
 * Indicator data for task cards - optional enriched data
 */
export interface TaskIndicators {
  subtaskCount?: number
  completedSubtaskCount?: number
  hasActiveTimer?: boolean
  totalTimeSpent?: number // seconds
  commentCount?: number
  attachmentCount?: number
  dependencyCount?: number
  isSnoozed?: boolean
  snoozedUntil?: string
  isBlocked?: boolean
}

export interface MagictodoTaskCardProps {
  task: TaskResponse
  indicators?: TaskIndicators
  onStatusChange?: (status: TaskStatus) => void
  onEdit?: () => void
  onDelete?: () => void
}

export function MagictodoTaskCard({
  task,
  indicators,
  onStatusChange,
  onEdit,
  onDelete,
}: MagictodoTaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TASK_STATUS.DONE
  const isSnoozed = indicators?.isSnoozed
  const isBlocked = indicators?.isBlocked

  // Format time duration
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <Card className={`
      ${isOverdue ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : ""}
      ${isSnoozed ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20" : ""}
      ${isBlocked ? "border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20" : ""}
    `}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onStatusChange) {
                  const nextStatus = task.status === TASK_STATUS.DONE 
                    ? TASK_STATUS.TODO 
                    : TASK_STATUS.DONE
                  onStatusChange(nextStatus)
                }
              }}
              className="hover:opacity-70 transition-opacity"
            >
              {STATUS_ICONS[task.status]}
            </button>
            <CardTitle className={`text-base ${task.status === TASK_STATUS.DONE ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {/* Indicator badges */}
            {isSnoozed && (
              <Badge variant="outline" className="h-5 px-1.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <BellOff className="h-3 w-3" />
              </Badge>
            )}
            {isBlocked && (
              <Badge variant="outline" className="h-5 px-1.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <AlertCircle className="h-3 w-3" />
              </Badge>
            )}
            <Badge className={PRIORITY_COLORS[task.priority]} variant="secondary">
              {task.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Indicators row */}
        {indicators && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* Subtask indicator */}
            {indicators.subtaskCount !== undefined && indicators.subtaskCount > 0 && (
              <div className="flex items-center gap-1" title="Subtasks">
                <ListTodo className="h-3.5 w-3.5" />
                <span className={indicators.completedSubtaskCount === indicators.subtaskCount ? "text-green-600" : ""}>
                  {indicators.completedSubtaskCount ?? 0}/{indicators.subtaskCount}
                </span>
              </div>
            )}

            {/* Timer indicator */}
            {indicators.hasActiveTimer && (
              <div className="flex items-center gap-1 text-blue-600 animate-pulse" title="Timer running">
                <Timer className="h-3.5 w-3.5" />
                <span>●</span>
              </div>
            )}

            {/* Time spent */}
            {indicators.totalTimeSpent !== undefined && indicators.totalTimeSpent > 0 && !indicators.hasActiveTimer && (
              <div className="flex items-center gap-1" title="Time tracked">
                <Timer className="h-3.5 w-3.5" />
                <span>{formatTime(indicators.totalTimeSpent)}</span>
              </div>
            )}

            {/* Comments indicator */}
            {indicators.commentCount !== undefined && indicators.commentCount > 0 && (
              <div className="flex items-center gap-1" title="Comments">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{indicators.commentCount}</span>
              </div>
            )}

            {/* Attachments indicator */}
            {indicators.attachmentCount !== undefined && indicators.attachmentCount > 0 && (
              <div className="flex items-center gap-1" title="Attachments">
                <Paperclip className="h-3.5 w-3.5" />
                <span>{indicators.attachmentCount}</span>
              </div>
            )}

            {/* Dependencies indicator */}
            {indicators.dependencyCount !== undefined && indicators.dependencyCount > 0 && (
              <div className="flex items-center gap-1" title="Dependencies">
                <Link2 className="h-3.5 w-3.5" />
                <span>{indicators.dependencyCount}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSnoozed && indicators?.snoozedUntil && (
              <span className="text-amber-600 font-medium">
                Snoozed until: {new Date(indicators.snoozedUntil).toLocaleDateString()}
              </span>
            )}
            {!isSnoozed && task.dueDate && (
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.tags && task.tags.length > 0 && (
              <span>• {task.tags.slice(0, 2).join(", ")}{task.tags.length > 2 ? "..." : ""}</span>
            )}
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" className="text-red-600" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple card wrapper for generic content
export function MagictodoCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

