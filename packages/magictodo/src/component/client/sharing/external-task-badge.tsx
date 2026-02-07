/**
 * @domain magictodo
 * @layer ui
 * @responsibility Badge showing external task origin (from different tenant)
 */

"use client"

import { useMemo } from "react"
import { Badge } from "@afenda/shadcn"
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipTrigger,
} from "@afenda/shadcn"
import { ExternalLink, Building2, Users } from "lucide-react"
import { cn } from "@afenda/shared/utils"

// ============ Types ============
interface ExternalTaskBadgeProps {
  /** The hierarchyCode of the task */
  hierarchyCode: string
  /** Current user's tenantCode */
  currentTenantCode: string
  /** Optional source tenant display name */
  sourceTenantName?: string
  /** Size variant */
  size?: "sm" | "md"
  /** Show full label vs icon only */
  variant?: "full" | "icon"
  className?: string
}

// ============ Helper Functions ============

/**
 * Extract tenantCode from hierarchyCode
 * Format: {tenantCode}:{taskCode}:{version}
 */
function extractTenantCode(hierarchyCode: string): string | null {
  if (!hierarchyCode) return null
  const parts = hierarchyCode.split(":")
  if (parts.length < 2) return null
  return parts[0] ?? null
}

/**
 * Check if task is from a different tenant
 */
function isFromDifferentTenant(
  hierarchyCode: string,
  currentTenantCode: string
): boolean {
  const taskTenantCode = extractTenantCode(hierarchyCode)
  if (!taskTenantCode) return false
  return taskTenantCode !== currentTenantCode
}

/**
 * Format tenant code for display (abbreviate if long)
 */
function formatTenantDisplay(tenantCode: string): string {
  if (tenantCode.length <= 8) return tenantCode
  return tenantCode.slice(0, 6) + "…"
}

// ============ Main Component ============
export function ExternalTaskBadge({
  hierarchyCode,
  currentTenantCode,
  sourceTenantName,
  size = "sm",
  variant = "full",
  className,
}: ExternalTaskBadgeProps) {
  // Check if this is an external task
  const isExternal = useMemo(
    () => isFromDifferentTenant(hierarchyCode, currentTenantCode),
    [hierarchyCode, currentTenantCode]
  )

  // Extract source tenant code
  const sourceTenantCode = useMemo(
    () => extractTenantCode(hierarchyCode),
    [hierarchyCode]
  )

  // Don't render if not external
  if (!isExternal || !sourceTenantCode) {
    return null
  }

  const displayName = sourceTenantName ?? formatTenantDisplay(sourceTenantCode)
  const isSmall = size === "sm"
  const isIconOnly = variant === "icon"

  const badgeContent = (
    <Badge
      variant="secondary"
      className={cn(
        "inline-flex items-center gap-1 font-normal",
        isSmall ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
        className
      )}
    >
      <Building2 className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {!isIconOnly && (
        <>
          <span className="sr-only">From </span>
          {displayName}
        </>
      )}
      <ExternalLink className={cn(isSmall ? "h-2.5 w-2.5" : "h-3 w-3", "opacity-70")} />
    </Badge>
  )

  // Wrap in tooltip for icon-only variant or when truncated
  if (isIconOnly || displayName !== sourceTenantCode) {
    return (
      <ClientTooltip>
        <ClientTooltipTrigger asChild>{badgeContent}</ClientTooltipTrigger>
        <ClientTooltipContent side="top" className="max-w-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">External Task</p>
              <p className="text-xs text-muted-foreground">
                From: {sourceTenantName ?? sourceTenantCode}
              </p>
            </div>
          </div>
        </ClientTooltipContent>
      </ClientTooltip>
    )
  }

  return badgeContent
}

// ============ Shared Task Indicator ============
interface SharedTaskIndicatorProps {
  /** Number of assignees on the task */
  assigneeCount: number
  /** Whether the current user owns the task */
  isOwner?: boolean
  size?: "sm" | "md"
  className?: string
}

/**
 * Shows indicator when task has been shared with others
 */
export function SharedTaskIndicator({
  assigneeCount,
  isOwner = false,
  size = "sm",
  className,
}: SharedTaskIndicatorProps) {
  if (assigneeCount <= 0) return null

  const isSmall = size === "sm"

  return (
    <ClientTooltip>
      <ClientTooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "inline-flex items-center gap-1 font-normal",
            isSmall ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
            isOwner
              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
              : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
            className
          )}
        >
          <Users className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
          <span>{assigneeCount}</span>
        </Badge>
      </ClientTooltipTrigger>
      <ClientTooltipContent side="top">
        <p>
          {isOwner
            ? `Shared with ${assigneeCount} team member${assigneeCount > 1 ? "s" : ""}`
            : `${assigneeCount} assignee${assigneeCount > 1 ? "s" : ""} on this task`}
        </p>
      </ClientTooltipContent>
    </ClientTooltip>
  )
}

// ============ Combined Task Sharing Status ============
interface TaskSharingStatusProps {
  hierarchyCode: string
  currentTenantCode: string
  sourceTenantName?: string
  assigneeCount?: number
  isOwner?: boolean
  size?: "sm" | "md"
  className?: string
}

/**
 * Combined component showing external + shared status
 */
export function TaskSharingStatus({
  hierarchyCode,
  currentTenantCode,
  sourceTenantName,
  assigneeCount = 0,
  isOwner = false,
  size = "sm",
  className,
}: TaskSharingStatusProps) {
  const isExternal = isFromDifferentTenant(hierarchyCode, currentTenantCode)

  if (!isExternal && assigneeCount <= 0) return null

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {isExternal && (
        <ExternalTaskBadge
          hierarchyCode={hierarchyCode}
          currentTenantCode={currentTenantCode}
          sourceTenantName={sourceTenantName}
          size={size}
        />
      )}
      {assigneeCount > 0 && (
        <SharedTaskIndicator
          assigneeCount={assigneeCount}
          isOwner={isOwner}
          size={size}
        />
      )}
    </div>
  )
}

export default ExternalTaskBadge
