"use client"

import * as React from "react"
import { useCallback } from "react"
import Link from "next/link"
import { ChevronRight, Home, ExternalLink } from "lucide-react"
import { cn } from "@afenda/shared/utils"
import { Button } from "@afenda/shadcn"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@afenda/shadcn"
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"

import {
  type BreadcrumbItem as BreadcrumbItemType,
  isExternalTask,
  getTenantFromCode,
} from "@afenda/magictodo/zod"

// ============ Props ============
interface TaskBreadcrumbProps {
  /** Breadcrumb items from root to current */
  items: BreadcrumbItemType[]
  /** Current tenant code for external task detection */
  currentTenantCode?: string
  /** Callback when a breadcrumb item is clicked */
  onNavigate?: (id: string) => void
  /** Whether to show home/root link */
  showHome?: boolean
  /** Home link URL or callback */
  homeHref?: string
  onHomeClick?: () => void
  /** Show hierarchy codes in breadcrumbs */
  showCodes?: boolean
  /** Maximum items to show before collapsing */
  maxItems?: number
  /** Custom class name */
  className?: string
}

export function TaskBreadcrumb({
  items,
  currentTenantCode,
  onNavigate,
  showHome = true,
  homeHref = "/app/magictodo/hierarchy",
  onHomeClick,
  showCodes = false,
  maxItems = 4,
  className,
}: TaskBreadcrumbProps) {
  const handleClick = useCallback(
    (id: string) => {
      onNavigate?.(id)
    },
    [onNavigate]
  )

  // Collapse middle items if too many
  const shouldCollapse = items.length > maxItems
  const visibleItems = shouldCollapse
    ? [
        items[0], // First (root)
        null, // Placeholder for collapsed
        ...items.slice(-2), // Last two
      ]
    : items

  const collapsedItems = shouldCollapse
    ? items.slice(1, -2)
    : []

  return (
    <Breadcrumb className={cn("", className)}>
      <BreadcrumbList>
        {/* Home */}
        {showHome && (
          <>
            <BreadcrumbItem>
              {onHomeClick ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 hover:bg-accent"
                  onClick={onHomeClick}
                >
                  <Home className="h-4 w-4" />
                </Button>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={homeHref}>
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {items.length > 0 && <BreadcrumbSeparator />}
          </>
        )}

        {/* Items */}
        {visibleItems.map((item, index) => {
          // Collapsed placeholder
          if (item === null) {
            return (
              <React.Fragment key="collapsed">
                <BreadcrumbItem>
                  <ClientTooltipProvider delayDuration={200}>
                    <ClientTooltip>
                      <ClientTooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-1 py-0.5 text-muted-foreground hover:bg-accent"
                        >
                          •••
                        </Button>
                      </ClientTooltipTrigger>
                      <ClientTooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          {collapsedItems.map((collapsed) => (
                            <button
                              key={collapsed.id}
                              className="block w-full text-left text-sm hover:text-primary truncate"
                              onClick={() => handleClick(collapsed.id)}
                            >
                              {collapsed.title}
                            </button>
                          ))}
                        </div>
                      </ClientTooltipContent>
                    </ClientTooltip>
                  </ClientTooltipProvider>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            )
          }

          const isLast = index === visibleItems.length - 1
          const isExternal =
            currentTenantCode && isExternalTask(item.hierarchyCode, currentTenantCode)

          return (
            <React.Fragment key={item.id}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    <span className="max-w-[150px] truncate">{item.title}</span>
                    {isExternal && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    )}
                    {showCodes && item.hierarchyCode && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0 h-4 font-mono ml-1"
                      >
                        {item.hierarchyCode}
                      </Badge>
                    )}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors max-w-[150px]"
                      onClick={() => handleClick(item.id)}
                    >
                      <span className="truncate">{item.title}</span>
                      {isExternal && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

// ============ Hierarchy Code Breadcrumb ============
/**
 * Alternative breadcrumb that displays hierarchy codes directly
 * Format: AX7-T1001 > AX7-T1001-01 > AX7-T1001-01-01
 */
interface HierarchyCodeBreadcrumbProps {
  /** The full hierarchy code to display */
  hierarchyCode: string
  /** Current tenant code for external detection */
  currentTenantCode?: string
  /** Callback when a code segment is clicked */
  onNavigate?: (code: string) => void
  className?: string
}

export function HierarchyCodeBreadcrumb({
  hierarchyCode,
  currentTenantCode,
  onNavigate,
  className,
}: HierarchyCodeBreadcrumbProps) {
  // Parse code into progressive segments
  // "AX7-T1001-01-01" -> ["AX7-T1001", "AX7-T1001-01", "AX7-T1001-01-01"]
  const segments = React.useMemo(() => {
    const parts = hierarchyCode.split("-")
    if (parts.length < 2) return [hierarchyCode]

    const result: string[] = []
    // First segment is always tenant + root (e.g., "AX7-T1001")
    result.push(`${parts[0]}-${parts[1]}`)

    // Build up remaining segments
    for (let i = 2; i < parts.length; i++) {
      result.push(`${result[result.length - 1]}-${parts[i]}`)
    }

    return result
  }, [hierarchyCode])

  const isExternal = currentTenantCode && isExternalTask(hierarchyCode, currentTenantCode)
  const tenantCode = getTenantFromCode(hierarchyCode)

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      {isExternal && tenantCode && (
        <>
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
            <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
            {tenantCode}
          </Badge>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </>
      )}

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1
        // Extract just the last part for display
        const displayPart = index === 0 ? segment : segment.split("-").pop()

        return (
          <React.Fragment key={segment}>
            {isLast ? (
              <span className="font-mono text-xs font-medium">{displayPart}</span>
            ) : (
              <button
                className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => onNavigate?.(segment)}
              >
                {displayPart}
              </button>
            )}
            {!isLast && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

// ============ Compact Breadcrumb ============
/**
 * Minimal breadcrumb showing only parent > current
 */
interface CompactBreadcrumbProps {
  parent?: { id: string; title: string } | null
  current: { id: string; title: string }
  onNavigateToParent?: (id: string) => void
  onNavigateToRoot?: () => void
  className?: string
}

export function CompactBreadcrumb({
  parent,
  current,
  onNavigateToParent,
  onNavigateToRoot,
  className,
}: CompactBreadcrumbProps) {
  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      {onNavigateToRoot && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 hover:bg-accent"
            onClick={onNavigateToRoot}
          >
            <Home className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </>
      )}

      {parent && (
        <>
          <button
            className="max-w-[120px] truncate text-muted-foreground hover:text-primary transition-colors"
            onClick={() => onNavigateToParent?.(parent.id)}
          >
            {parent.title}
          </button>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </>
      )}

      <span className="max-w-[150px] truncate font-medium">{current.title}</span>
    </nav>
  )
}
