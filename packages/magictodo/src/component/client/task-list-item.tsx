/**
 * Enhanced Task List Item Component
 * 
 * @domain magictodo
 * @layer component
 * @responsibility Displays a task in list view with rich indicators
 */

"use client"

import { cn } from "@afenda/shared/utils"
import { Badge } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
  ItemDescription,
} from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Calendar,
  ListTodo,
  Timer,
  MessageSquare,
  Paperclip,
  Link2,
  BellOff,
  AlertCircle,
  MoreHorizontal,
  Moon,
  Sun,
  CalendarDays,
} from "lucide-react"
import type { TaskResponse } from "@afenda/magictodo/zod"
import type { TaskIndicators } from "@afenda/magictodo"

// Priority to border color mapping
const PRIORITY_BORDERS: Record<string, string> = {
  low: "border-l-gray-400",
  medium: "border-l-blue-500",
  high: "border-l-orange-500",
  urgent: "border-l-red-500",
}

// Priority badge variants
const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  urgent: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
}

// Snooze presets
const SNOOZE_PRESETS = [
  { preset: "later_today", label: "Later today", description: "In 3 hours", icon: Clock },
  { preset: "tonight", label: "Tonight", description: "7:00 PM", icon: Moon },
  { preset: "tomorrow_morning", label: "Tomorrow morning", description: "9:00 AM", icon: Sun },
  { preset: "next_week", label: "Next week", description: "Monday 9:00 AM", icon: CalendarDays },
] as const

export interface TaskListItemProps {
  task: TaskResponse
  indicators?: TaskIndicators
  onToggleDone: (taskId: string, currentStatus: string) => void
  onDelete: (taskId: string) => void
  onClick: (task: TaskResponse) => void
  onSnooze?: (taskId: string, preset: string) => Promise<void>
  onUnsnooze?: (taskId: string) => Promise<void>
}

/**
 * Format time duration in human readable format
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/**
 * Format snooze time remaining
 */
function formatSnoozeUntil(snoozedUntil: string): string {
  const date = new Date(snoozedUntil)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  
  if (diffMs < 0) return "Expired"
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffHours < 1) return "< 1h"
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays === 1) return "Tomorrow"
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString(undefined, { 
    month: "short", 
    day: "numeric" 
  })
}

export function TaskListItem({
  task,
  indicators,
  onToggleDone,
  onDelete,
  onClick,
  onSnooze,
  onUnsnooze,
}: TaskListItemProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done"
  const isSnoozed = indicators?.isSnoozed
  const isBlocked = indicators?.isBlocked
  const hasActiveTimer = indicators?.hasActiveTimer
  const hasSubtasks = indicators?.subtaskCount && indicators.subtaskCount > 0

  return (
    <Item 
      variant="outline" 
      size="sm" 
      className={cn(
        "cursor-pointer hover:bg-muted/50 border-l-4",
        PRIORITY_BORDERS[task.priority] || "border-l-gray-300",
        isOverdue && "bg-red-50/50 dark:bg-red-950/10",
        isSnoozed && "bg-amber-50/50 dark:bg-amber-950/10",
        isBlocked && "bg-orange-50/50 dark:bg-orange-950/10"
      )} 
      onClick={() => onClick(task)}
    >
      {/* Status toggle button */}
      <ItemMedia variant="icon">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 sm:size-9"
          onClick={(e) => {
            e.stopPropagation()
            onToggleDone(task.id, task.status)
          }}
          aria-label={task.status === "done" ? "Mark task as to do" : "Mark task as done"}
        >
          {task.status === "done" ? (
            <CheckCircle2 className="size-4 sm:size-5 text-primary" />
          ) : task.status === "in_progress" ? (
            <Clock className="size-4 sm:size-5 text-blue-500" />
          ) : (
            <Circle className="size-4 sm:size-5 text-muted-foreground" />
          )}
        </Button>
      </ItemMedia>

      <ItemContent className="min-w-0">
        {/* Title row with indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <ItemTitle
            className={cn(
              "wrap-break-word text-sm sm:text-base",
              task.status === "done" && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </ItemTitle>

          {/* Inline indicator badges */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Snoozed badge */}
            {isSnoozed && (
              <Badge 
                variant="outline" 
                className="h-5 px-1.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-0.5"
                title={indicators?.snoozedUntil ? `Snoozed until ${formatSnoozeUntil(indicators.snoozedUntil)}` : "Snoozed"}
              >
                <BellOff className="h-3 w-3" />
                {indicators?.snoozedUntil && (
                  <span className="hidden sm:inline">{formatSnoozeUntil(indicators.snoozedUntil)}</span>
                )}
              </Badge>
            )}

            {/* Active timer badge */}
            {hasActiveTimer && (
              <Badge 
                variant="outline" 
                className="h-5 px-1.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-0.5 animate-pulse"
                title="Timer running"
              >
                <Timer className="h-3 w-3" />
                <span className="hidden sm:inline">●</span>
              </Badge>
            )}

            {/* Blocked badge */}
            {isBlocked && (
              <Badge 
                variant="outline" 
                className="h-5 px-1.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                title="Blocked by dependencies"
              >
                <AlertCircle className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <ItemDescription className="line-clamp-1 text-xs sm:text-sm">
            {task.description}
          </ItemDescription>
        )}

        {/* Bottom row: metadata + indicators */}
        <div className="mt-2 flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Due date */}
          {task.dueDate && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs gap-1",
                isOverdue && "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:bg-red-950/30"
              )}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Badge>
          )}

          {/* Priority badge */}
          {task.priority && (
            <Badge variant={PRIORITY_VARIANTS[task.priority]} className="text-xs">
              {task.priority}
            </Badge>
          )}

          {/* Indicator pills */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {/* Subtask progress */}
            {hasSubtasks && (
              <div 
                className={cn(
                  "flex items-center gap-1",
                  indicators?.completedSubtaskCount === indicators?.subtaskCount && "text-green-600"
                )} 
                title={`${indicators?.completedSubtaskCount ?? 0}/${indicators?.subtaskCount} subtasks`}
              >
                <ListTodo className="h-3.5 w-3.5" />
                <span>{indicators?.completedSubtaskCount ?? 0}/{indicators?.subtaskCount}</span>
              </div>
            )}

            {/* Time spent (if not running) */}
            {!hasActiveTimer && indicators?.totalTimeSpent && indicators.totalTimeSpent > 0 && (
              <div className="flex items-center gap-1" title="Time tracked">
                <Timer className="h-3.5 w-3.5" />
                <span>{formatTime(indicators.totalTimeSpent)}</span>
              </div>
            )}

            {/* Comments */}
            {indicators?.commentCount && indicators.commentCount > 0 && (
              <div className="flex items-center gap-1" title={`${indicators.commentCount} comments`}>
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{indicators.commentCount}</span>
              </div>
            )}

            {/* Attachments */}
            {indicators?.attachmentCount && indicators.attachmentCount > 0 && (
              <div className="flex items-center gap-1" title={`${indicators.attachmentCount} attachments`}>
                <Paperclip className="h-3.5 w-3.5" />
                <span>{indicators.attachmentCount}</span>
              </div>
            )}

            {/* Dependencies */}
            {indicators?.dependencyCount && indicators.dependencyCount > 0 && (
              <div className="flex items-center gap-1" title={`${indicators.dependencyCount} dependencies`}>
                <Link2 className="h-3.5 w-3.5" />
                <span>{indicators.dependencyCount}</span>
              </div>
            )}
          </div>

          {/* Tags (last, take remaining space) */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-auto">
              {task.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </ItemContent>

      {/* Actions */}
      <ItemActions className="flex items-center gap-1">
        {/* Snooze dropdown menu */}
        {(onSnooze || onUnsnooze) && (
          <ClientDropdownMenu>
            <ClientDropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "size-8 sm:size-auto",
                  isSnoozed && "text-amber-600 hover:text-amber-600"
                )}
                aria-label="Snooze options"
              >
                <BellOff className="size-3 sm:size-4" />
              </Button>
            </ClientDropdownMenuTrigger>
            <ClientDropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {isSnoozed ? (
                <>
                  <ClientDropdownMenuItem 
                    onClick={() => onUnsnooze?.(task.id)}
                    className="text-amber-600"
                  >
                    <BellOff className="mr-2 h-4 w-4" />
                    Unsnooze task
                  </ClientDropdownMenuItem>
                </>
              ) : (
                <>
                  {SNOOZE_PRESETS.map(({ preset, label, description, icon: Icon }) => (
                    <ClientDropdownMenuItem
                      key={preset}
                      onClick={() => onSnooze?.(task.id, preset)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{label}</span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                      </div>
                    </ClientDropdownMenuItem>
                  ))}
                  <ClientDropdownMenuSeparator />
                  <ClientDropdownMenuItem onClick={() => onClick(task)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Pick a date...
                  </ClientDropdownMenuItem>
                </>
              )}
            </ClientDropdownMenuContent>
          </ClientDropdownMenu>
        )}

        {/* More actions dropdown */}
        <ClientDropdownMenu>
          <ClientDropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="size-8 sm:size-auto"
              aria-label="More actions"
            >
              <MoreHorizontal className="size-3 sm:size-4" />
            </Button>
            </ClientDropdownMenuTrigger>
            <ClientDropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <ClientDropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete task
            </ClientDropdownMenuItem>
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>
      </ItemActions>
    </Item>
  )
}
