/**
 * @domain magictodo
 * @layer ui
 * @responsibility Contextual undo toasts after every mutation
 * Undo Toast Provider - Shows actionable undo toasts for task operations
 */

"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import { toast } from "sonner"
import { Clock, CheckCircle2, Trash2 } from "lucide-react"

// ============ Types ============
export type UndoAction = "complete" | "delete" | "snooze" | "archive" | "update" | "create" | "bulk"

interface UndoToastOptions {
  action: UndoAction
  itemName?: string
  itemCount?: number
  onUndo: () => Promise<void> | void
  onView?: () => void
  duration?: number
}

interface UndoToastContextValue {
  showUndoToast: (options: UndoToastOptions) => void
}

// ============ Context ============
const UndoToastContext = createContext<UndoToastContextValue | null>(null)

export function useUndoToast() {
  const context = useContext(UndoToastContext)
  if (!context) {
    throw new Error("useUndoToast must be used within UndoToastProvider")
  }
  return context
}

// ============ Message Helpers ============
const ACTION_MESSAGES: Record<UndoAction, (name?: string, count?: number) => string> = {
  complete: (name) => name ? `"${name}" completed` : "Task completed",
  delete: (name, count) => count && count > 1 ? `${count} tasks deleted` : name ? `"${name}" deleted` : "Task deleted",
  snooze: (name) => name ? `"${name}" snoozed` : "Task snoozed",
  archive: (name) => name ? `"${name}" archived` : "Task archived",
  update: (name) => name ? `"${name}" updated` : "Task updated",
  create: (name) => name ? `"${name}" created` : "Task created",
  bulk: (_, count) => `${count ?? 0} tasks updated`,
}

const ACTION_ICONS: Record<UndoAction, typeof CheckCircle2> = {
  complete: CheckCircle2,
  delete: Trash2,
  snooze: Clock,
  archive: Trash2,
  update: CheckCircle2,
  create: CheckCircle2,
  bulk: CheckCircle2,
}

// ============ Provider ============
interface UndoToastProviderProps {
  children: ReactNode
}

export function UndoToastProvider({ children }: UndoToastProviderProps) {
  const showUndoToast = useCallback((options: UndoToastOptions) => {
    const { action, itemName, itemCount, onUndo, onView, duration = 5000 } = options
    const message = ACTION_MESSAGES[action](itemName, itemCount)
    const Icon = ACTION_ICONS[action]

    toast.success(message, {
      duration,
      icon: <Icon className="h-4 w-4" />,
      action: {
        label: "Undo",
        onClick: async () => {
          try {
            await onUndo()
            toast.success("Action undone")
          } catch (_error) {
            toast.error("Failed to undo. Please try again.")
          }
        },
      },
      cancel: onView
        ? {
            label: "View",
            onClick: onView,
          }
        : undefined,
    })
  }, [])

  return (
    <UndoToastContext.Provider value={{ showUndoToast }}>
      {children}
    </UndoToastContext.Provider>
  )
}

// ============ Specialized Hooks ============

/**
 * Hook for task completion with undo
 */
export function useCompleteWithUndo() {
  const { showUndoToast } = useUndoToast()

  return useCallback(
    (options: {
      taskId: string
      taskName: string
      onComplete: () => Promise<void>
      onUndo: () => Promise<void>
      onView?: () => void
    }) => {
      const { taskName, onComplete, onUndo, onView } = options

      return async () => {
        await onComplete()
        showUndoToast({
          action: "complete",
          itemName: taskName,
          onUndo,
          onView,
        })
      }
    },
    [showUndoToast]
  )
}

/**
 * Hook for task deletion with undo
 */
export function useDeleteWithUndo() {
  const { showUndoToast } = useUndoToast()

  return useCallback(
    (options: {
      taskIds: string[]
      taskName?: string
      onDelete: () => Promise<void>
      onUndo: () => Promise<void>
    }) => {
      const { taskIds, taskName, onDelete, onUndo } = options

      return async () => {
        await onDelete()
        showUndoToast({
          action: "delete",
          itemName: taskName,
          itemCount: taskIds.length,
          onUndo,
        })
      }
    },
    [showUndoToast]
  )
}

/**
 * Hook for task snooze with reschedule option
 */
export function useSnoozeWithUndo() {
  const { showUndoToast: _showUndoToast } = useUndoToast()

  return useCallback(
    (options: {
      taskId: string
      taskName: string
      snoozedUntil: Date
      onSnooze: () => Promise<void>
      onUndo: () => Promise<void>
      onReschedule?: () => void
    }) => {
      const { taskName, onSnooze, onUndo, onReschedule } = options

      return async () => {
        await onSnooze()
        
        toast.success(`"${taskName}" snoozed`, {
          duration: 5000,
          icon: <Clock className="h-4 w-4" />,
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                await onUndo()
                toast.success("Snooze cancelled")
              } catch {
                toast.error("Failed to undo")
              }
            },
          },
          cancel: onReschedule
            ? {
                label: "Reschedule",
                onClick: onReschedule,
              }
            : undefined,
        })
      }
    },
    []
  )
}

/**
 * Hook for bulk operations with undo
 */
export function useBulkActionWithUndo() {
  const { showUndoToast: _showUndoToast } = useUndoToast()

  return useCallback(
    (options: {
      count: number
      actionLabel: string
      onAction: () => Promise<void>
      onUndo: () => Promise<void>
    }) => {
      const { count, actionLabel, onAction, onUndo } = options

      return async () => {
        await onAction()
        
        toast.success(`${count} tasks ${actionLabel}`, {
          duration: 7000, // Longer duration for bulk actions
          action: {
            label: "Undo All",
            onClick: async () => {
              try {
                await onUndo()
                toast.success(`${count} tasks restored`)
              } catch {
                toast.error("Failed to undo")
              }
            },
          },
        })
      }
    },
    []
  )
}
