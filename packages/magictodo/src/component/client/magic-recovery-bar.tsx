/**
 * @domain magictodo
 * @layer ui
 * @responsibility Auto-surfaces on any mutation error with retry, offline option
 * Magic Recovery Bar - Smart error recovery UI
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import {
  AlertCircle,
  RefreshCw,
  WifiOff,
  X,
  Undo2,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"

export interface RecoveryError {
  id: string
  message: string
  description?: string
  type: "network" | "validation" | "conflict" | "unknown"
  retryFn?: () => Promise<void>
  timestamp: Date
}

interface MagicRecoveryBarProps {
  className?: string
}

// Global error queue - can be accessed from mutation hooks
const errorQueue: RecoveryError[] = []
const errorListeners: Set<(errors: RecoveryError[]) => void> = new Set()

function notifyListeners() {
  errorListeners.forEach((listener) => listener([...errorQueue]))
}

/**
 * Add an error to the recovery queue
 */
export function addRecoveryError(error: Omit<RecoveryError, "id" | "timestamp">) {
  const newError: RecoveryError = {
    ...error,
    id: `error-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date(),
  }
  errorQueue.push(newError)
  notifyListeners()
  return newError.id
}

/**
 * Remove an error from the recovery queue
 */
export function removeRecoveryError(id: string) {
  const index = errorQueue.findIndex((e) => e.id === id)
  if (index !== -1) {
    errorQueue.splice(index, 1)
    notifyListeners()
  }
}

/**
 * Clear all recovery errors
 */
export function clearRecoveryErrors() {
  errorQueue.length = 0
  notifyListeners()
}

/**
 * Hook to subscribe to recovery errors
 */
export function useRecoveryErrors() {
  const [errors, setErrors] = useState<RecoveryError[]>([...errorQueue])

  useEffect(() => {
    const listener = (newErrors: RecoveryError[]) => setErrors(newErrors)
    errorListeners.add(listener)
    return () => {
      errorListeners.delete(listener)
    }
  }, [])

  return {
    errors,
    addError: addRecoveryError,
    removeError: removeRecoveryError,
    clearErrors: clearRecoveryErrors,
  }
}

/**
 * Detect error type from error object
 */
function detectErrorType(error: Error | unknown): RecoveryError["type"] {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes("network") || message.includes("fetch") || message.includes("offline")) {
      return "network"
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return "validation"
    }
    if (message.includes("conflict") || message.includes("version")) {
      return "conflict"
    }
  }
  return "unknown"
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(type: RecoveryError["type"], originalMessage?: string): { title: string; description: string } {
  switch (type) {
    case "network":
      return {
        title: "Connection issue",
        description: "Couldn't reach the server. Check your connection or work offline.",
      }
    case "validation":
      return {
        title: "Invalid data",
        description: originalMessage ?? "Please check your input and try again.",
      }
    case "conflict":
      return {
        title: "Conflict detected",
        description: "This item was modified elsewhere. Review changes before saving.",
      }
    default:
      return {
        title: "Something went wrong",
        description: originalMessage ?? "An unexpected error occurred. Please try again.",
      }
  }
}

const TYPE_ICONS = {
  network: WifiOff,
  validation: AlertCircle,
  conflict: RefreshCw,
  unknown: AlertCircle,
}

export function MagicRecoveryBar({ className }: MagicRecoveryBarProps) {
  const { errors, removeError, clearErrors } = useRecoveryErrors()
  const [retrying, setRetrying] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = useCallback(async (error: RecoveryError) => {
    if (!error.retryFn) return

    setRetrying(error.id)
    try {
      await error.retryFn()
      removeError(error.id)
      toast.success("Action completed successfully")
    } catch (e) {
      toast.error("Retry failed. Please try again.")
    } finally {
      setRetrying(null)
    }
  }, [removeError])

  const handleWorkOffline = useCallback(() => {
    // Clear network errors when user opts to work offline
    const networkErrors = errors.filter((e) => e.type === "network")
    networkErrors.forEach((e) => removeError(e.id))
    toast.info("Working offline. Changes will sync when you're back online.")
  }, [errors, removeError])

  // Don't render if no errors
  if (errors.length === 0) return null

  // Show only the most recent error prominently, with count of others
  const latestError = errors[errors.length - 1]!
  const Icon = TYPE_ICONS[latestError.type]
  const { title, description } = getErrorMessage(latestError.type, latestError.message)

  return (
    <div className={cn("fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96", className)}>
      <Alert variant="destructive" className="relative shadow-lg">
        <Icon className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2"
            onClick={() => removeError(latestError.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm mb-3">{description}</p>
          <div className="flex items-center gap-2">
            {latestError.retryFn && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRetry(latestError)}
                disabled={retrying === latestError.id || !isOnline}
              >
                {retrying === latestError.id ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Retry
              </Button>
            )}
            {latestError.type === "network" && (
              <Button size="sm" variant="outline" onClick={handleWorkOffline}>
                <WifiOff className="h-4 w-4 mr-1" />
                Work Offline
              </Button>
            )}
            {errors.length > 1 && (
              <Button size="sm" variant="ghost" onClick={clearErrors}>
                Dismiss all ({errors.length})
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/**
 * Wrapper for mutation functions to auto-add recovery errors
 */
export function withRecovery<T extends (...args: any[]) => Promise<any>>(
  mutationFn: T,
  options?: {
    successMessage?: string
    errorMessage?: string
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      const result = await mutationFn(...args)
      if (options?.successMessage) {
        toast.success(options.successMessage)
      }
      return result
    } catch (error) {
      const type = detectErrorType(error)
      addRecoveryError({
        message: options?.errorMessage ?? (error instanceof Error ? error.message : "Operation failed"),
        type,
        retryFn: () => mutationFn(...args),
      })
      throw error
    }
  }) as T
}
