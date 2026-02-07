/**
 * @domain magictodo
 * @layer ui
 * @responsibility Shows sync status - synced/pending/offline
 * Sync Status Indicator - Visual indicator for data synchronization state
 */

"use client"

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import { Badge } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn"
import {
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
} from "@afenda/shadcn"
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"

// ============ Types ============
export type SyncStatus = "synced" | "pending" | "syncing" | "offline" | "error"

export interface PendingChange {
  id: string
  type: "create" | "update" | "delete"
  entity: "task" | "project" | "comment" | "attachment"
  name?: string
  timestamp: Date
}

interface SyncState {
  status: SyncStatus
  isOnline: boolean
  pendingChanges: PendingChange[]
  lastSyncedAt: Date | null
  error: string | null
}

interface SyncContextValue extends SyncState {
  addPendingChange: (change: Omit<PendingChange, "id" | "timestamp">) => void
  removePendingChange: (id: string) => void
  clearPendingChanges: () => void
  setError: (error: string | null) => void
  setSyncing: () => void
  setSynced: () => void
  retry: () => Promise<void>
}

// ============ Context ============
const SyncContext = createContext<SyncContextValue | null>(null)

export function useSyncStatus() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error("useSyncStatus must be used within SyncStatusProvider")
  }
  return context
}

// ============ Provider ============
interface SyncStatusProviderProps {
  children: ReactNode
  onRetry?: () => Promise<void>
}

export function SyncStatusProvider({ children, onRetry }: SyncStatusProviderProps) {
  const [state, setState] = useState<SyncState>({
    status: "synced",
    isOnline: true,
    pendingChanges: [],
    lastSyncedAt: null,
    error: null,
  })

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: true,
        status: prev.pendingChanges.length > 0 ? "pending" : "synced",
      }))
    }

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: false,
        status: "offline",
      }))
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setState((prev) => ({ ...prev, isOnline: navigator.onLine }))

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const addPendingChange = useCallback((change: Omit<PendingChange, "id" | "timestamp">) => {
    const newChange: PendingChange = {
      ...change,
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
    }
    setState((prev) => ({
      ...prev,
      pendingChanges: [...prev.pendingChanges, newChange],
      status: prev.isOnline ? "pending" : "offline",
    }))
  }, [])

  const removePendingChange = useCallback((id: string) => {
    setState((prev) => {
      const newChanges = prev.pendingChanges.filter((c) => c.id !== id)
      return {
        ...prev,
        pendingChanges: newChanges,
        status: newChanges.length === 0 && prev.isOnline ? "synced" : prev.status,
        lastSyncedAt: newChanges.length === 0 ? new Date() : prev.lastSyncedAt,
      }
    })
  }, [])

  const clearPendingChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pendingChanges: [],
      status: prev.isOnline ? "synced" : "offline",
      lastSyncedAt: new Date(),
    }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
      status: error ? "error" : prev.pendingChanges.length > 0 ? "pending" : "synced",
    }))
  }, [])

  const setSyncing = useCallback(() => {
    setState((prev) => ({ ...prev, status: "syncing", error: null }))
  }, [])

  const setSynced = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "synced",
      error: null,
      pendingChanges: [],
      lastSyncedAt: new Date(),
    }))
  }, [])

  const retry = useCallback(async () => {
    if (onRetry) {
      setSyncing()
      try {
        await onRetry()
        setSynced()
      } catch (error) {
        setError(error instanceof Error ? error.message : "Sync failed")
      }
    }
  }, [onRetry, setSyncing, setSynced, setError])

  return (
    <SyncContext.Provider
      value={{
        ...state,
        addPendingChange,
        removePendingChange,
        clearPendingChanges,
        setError,
        setSyncing,
        setSynced,
        retry,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}

// ============ Indicator Component ============
interface SyncStatusIndicatorProps {
  className?: string
  showLabel?: boolean
  variant?: "icon" | "badge" | "full"
}

const STATUS_CONFIG = {
  synced: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Synced",
    description: "All changes saved",
  },
  pending: {
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Pending",
    description: "Changes waiting to sync",
  },
  syncing: {
    icon: Loader2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Syncing",
    description: "Saving changes...",
  },
  offline: {
    icon: CloudOff,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    label: "Offline",
    description: "Working locally",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Error",
    description: "Sync failed",
  },
}

export function SyncStatusIndicator({
  className,
  showLabel = false,
  variant = "icon",
}: SyncStatusIndicatorProps) {
  const { status, pendingChanges, lastSyncedAt, error, retry, isOnline } = useSyncStatus()

  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const isSpinning = status === "syncing"

  const formatLastSynced = (date: Date | null) => {
    if (!date) return "Never"
    const diff = Date.now() - date.getTime()
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  if (variant === "icon") {
    return (
      <ClientTooltipProvider>
        <ClientTooltip>
          <ClientTooltipTrigger asChild>
            <button className={cn("p-1 rounded-md hover:bg-muted transition-colors", className)}>
              <Icon
                className={cn("h-4 w-4", config.color, isSpinning && "animate-spin")}
              />
            </button>
          </ClientTooltipTrigger>
          <ClientTooltipContent>
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            {pendingChanges.length > 0 && (
              <p className="text-xs mt-1">{pendingChanges.length} pending changes</p>
            )}
          </ClientTooltipContent>
        </ClientTooltip>
      </ClientTooltipProvider>
    )
  }

  if (variant === "badge") {
    return (
      <Badge
        variant="outline"
        className={cn("gap-1.5", config.bgColor, className)}
      >
        <Icon className={cn("h-3 w-3", config.color, isSpinning && "animate-spin")} />
        {showLabel && <span>{config.label}</span>}
        {pendingChanges.length > 0 && (
          <span className="ml-1 px-1 rounded-full bg-muted text-xs">
            {pendingChanges.length}
          </span>
        )}
      </Badge>
    )
  }

  // Full variant with popover
  return (
    <ClientPopover>
      <ClientPopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", className)}
        >
          <Icon className={cn("h-4 w-4", config.color, isSpinning && "animate-spin")} />
          <span className="hidden sm:inline">{config.label}</span>
          {pendingChanges.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {pendingChanges.length}
            </Badge>
          )}
        </Button>
      </ClientPopoverTrigger>
      <ClientPopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className="h-5 w-5 text-green-500" />
              ) : (
                <CloudOff className="h-5 w-5 text-gray-500" />
              )}
              <div>
                <p className="font-medium">{isOnline ? "Online" : "Offline"}</p>
                <p className="text-xs text-muted-foreground">
                  Last synced: {formatLastSynced(lastSyncedAt)}
                </p>
              </div>
            </div>
            {(status === "error" || status === "pending") && isOnline && (
              <Button size="sm" variant="outline" onClick={retry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync
              </Button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {pendingChanges.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Pending Changes</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {pendingChanges.slice(0, 5).map((change) => (
                  <div
                    key={change.id}
                    className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                  >
                    <span className="capitalize">
                      {change.type} {change.entity}
                      {change.name && `: ${change.name}`}
                    </span>
                    <span className="text-muted-foreground">
                      {formatLastSynced(change.timestamp)}
                    </span>
                  </div>
                ))}
                {pendingChanges.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{pendingChanges.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {status === "synced" && pendingChanges.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-4 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>All changes saved</span>
            </div>
          )}
        </div>
      </ClientPopoverContent>
    </ClientPopover>
  )
}
