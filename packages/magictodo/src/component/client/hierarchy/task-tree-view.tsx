"use client"

import * as React from "react"
import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  ChevronDown,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  GripVertical,
  MoreHorizontal,
  Plus,
  Folder,
  FolderOpen,
  Star,
  Pin,
  ExternalLink,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"
import { Button } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@afenda/shadcn"

import { TASK_STATUS, TASK_PRIORITY, type TaskResponse } from "@afenda/magictodo/zod"
import {
  type TreeNode,
  type FlatNode,
  isExternalTask,
  getTenantFromCode,
} from "@afenda/magictodo/zod"

// ============ Status Icons ============
const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [TASK_STATUS.TODO]: Circle,
  [TASK_STATUS.IN_PROGRESS]: Clock,
  [TASK_STATUS.DONE]: CheckCircle2,
  [TASK_STATUS.CANCELLED]: AlertCircle,
}

const STATUS_COLORS: Record<string, string> = {
  [TASK_STATUS.TODO]: "text-muted-foreground",
  [TASK_STATUS.IN_PROGRESS]: "text-blue-500",
  [TASK_STATUS.DONE]: "text-green-500",
  [TASK_STATUS.CANCELLED]: "text-red-500",
}

const PRIORITY_COLORS: Record<string, string> = {
  [TASK_PRIORITY.LOW]: "border-l-gray-400",
  [TASK_PRIORITY.MEDIUM]: "border-l-blue-400",
  [TASK_PRIORITY.HIGH]: "border-l-orange-400",
  [TASK_PRIORITY.URGENT]: "border-l-red-500",
}

// ============ Tree Node Component ============
interface TaskTreeNodeProps {
  node: TreeNode
  level: number
  isExpanded: boolean
  isLoading?: boolean
  currentTenantCode?: string
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onAddChild?: (parentId: string) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onPromote?: (id: string) => void
  onDemote?: (id: string) => void
  selectedId?: string
  draggable?: boolean
}

export function TaskTreeNode({
  node,
  level,
  isExpanded,
  isLoading,
  currentTenantCode,
  onToggle,
  onSelect,
  onAddChild,
  onMoveUp,
  onMoveDown,
  onPromote,
  onDemote,
  selectedId,
  draggable,
}: TaskTreeNodeProps) {
  const hasChildren = (node.children?.length ?? 0) > 0 || node.hasChildren
  const StatusIcon = STATUS_ICONS[node.status] ?? Circle
  const isSelected = selectedId === node.id
  const isExternal = currentTenantCode && isExternalTask(node.hierarchyCode, currentTenantCode)
  const externalTenant = isExternal ? getTenantFromCode(node.hierarchyCode) : null

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggle(node.id)
    },
    [node.id, onToggle]
  )

  const handleSelect = useCallback(() => {
    onSelect(node.id)
  }, [node.id, onSelect])

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggle(node.id)}>
      <div
        className={cn(
          "group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent",
          PRIORITY_COLORS[node.priority],
          "border-l-2"
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Toggle */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-5 w-5 p-0 hover:bg-accent",
              !hasChildren && "invisible"
            )}
            onClick={handleToggle}
          >
            {isLoading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            ) : isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* Status Icon */}
        <ClientTooltipProvider delayDuration={300}>
          <ClientTooltip>
            <ClientTooltipTrigger asChild>
              <button className="p-0.5">
                <StatusIcon
                  className={cn("h-4 w-4", STATUS_COLORS[node.status])}
                />
              </button>
            </ClientTooltipTrigger>
            <ClientTooltipContent side="top">
              <p className="capitalize">{node.status.replace("_", " ")}</p>
            </ClientTooltipContent>
          </ClientTooltip>
        </ClientTooltipProvider>

        {/* Task Title */}
        <span
          className={cn(
            "flex-1 truncate text-sm",
            node.status === TASK_STATUS.DONE && "line-through text-muted-foreground"
          )}
        >
          {node.title}
        </span>

        {/* Indicators */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.isPinned && (
            <Pin className="h-3.5 w-3.5 text-orange-500" />
          )}
          {node.isStarred && (
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          )}
          {isExternal && externalTenant && (
            <ClientTooltipProvider delayDuration={200}>
              <ClientTooltip>
                <ClientTooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                    {externalTenant}
                  </Badge>
                </ClientTooltipTrigger>
                <ClientTooltipContent>
                  <p>External task from {externalTenant}</p>
                </ClientTooltipContent>
              </ClientTooltip>
            </ClientTooltipProvider>
          )}
        </div>

        {/* Hierarchy Code Badge */}
        {node.hierarchyCode && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
            {node.hierarchyCode}
          </Badge>
        )}

        {/* Child Count */}
        {hasChildren && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
            {node.children?.length ?? node.childCount ?? 0}
          </Badge>
        )}

        {/* Actions Menu */}
        <ClientDropdownMenu>
          <ClientDropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </ClientDropdownMenuTrigger>
          <ClientDropdownMenuContent align="end" className="w-48">
            {onAddChild && (
              <ClientDropdownMenuItem onClick={() => onAddChild(node.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add subtask
              </ClientDropdownMenuItem>
            )}
            <ClientDropdownMenuSeparator />
            {onMoveUp && (
              <ClientDropdownMenuItem onClick={() => onMoveUp(node.id)}>
                Move up
              </ClientDropdownMenuItem>
            )}
            {onMoveDown && (
              <ClientDropdownMenuItem onClick={() => onMoveDown(node.id)}>
                Move down
              </ClientDropdownMenuItem>
            )}
            {onPromote && level > 0 && (
              <ClientDropdownMenuItem onClick={() => onPromote(node.id)}>
                Promote (outdent)
              </ClientDropdownMenuItem>
            )}
            {onDemote && (
              <ClientDropdownMenuItem onClick={() => onDemote(node.id)}>
                Demote (indent)
              </ClientDropdownMenuItem>
            )}
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>
      </div>

      {/* Children */}
      <CollapsibleContent>
        {node.children?.map((child) => (
          <TaskTreeNode
            key={child.id}
            node={child}
            level={level + 1}
            isExpanded={false}
            currentTenantCode={currentTenantCode}
            onToggle={onToggle}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onPromote={onPromote}
            onDemote={onDemote}
            selectedId={selectedId}
            draggable={draggable}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

// ============ Tree View Component ============
interface TaskTreeViewProps {
  nodes: TreeNode[]
  expandedIds: Set<string>
  currentTenantCode?: string
  selectedId?: string
  isLoading?: boolean
  loadingIds?: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onAddChild?: (parentId: string) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onPromote?: (id: string) => void
  onDemote?: (id: string) => void
  onExpandAll?: () => void
  onCollapseAll?: () => void
  draggable?: boolean
  className?: string
  emptyMessage?: string
}

export function TaskTreeView({
  nodes,
  expandedIds,
  currentTenantCode,
  selectedId,
  isLoading,
  loadingIds,
  onToggle,
  onSelect,
  onAddChild,
  onMoveUp,
  onMoveDown,
  onPromote,
  onDemote,
  onExpandAll,
  onCollapseAll,
  draggable,
  className,
  emptyMessage = "No tasks found",
}: TaskTreeViewProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 px-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
        <Folder className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {/* Toolbar */}
      {(onExpandAll || onCollapseAll) && (
        <div className="flex items-center gap-2 mb-2 px-2">
          {onExpandAll && (
            <Button variant="ghost" size="sm" onClick={onExpandAll}>
              <FolderOpen className="h-4 w-4 mr-1" />
              Expand all
            </Button>
          )}
          {onCollapseAll && (
            <Button variant="ghost" size="sm" onClick={onCollapseAll}>
              <Folder className="h-4 w-4 mr-1" />
              Collapse all
            </Button>
          )}
        </div>
      )}

      {/* Tree */}
      {nodes.map((node) => (
        <TaskTreeNode
          key={node.id}
          node={node}
          level={0}
          isExpanded={expandedIds.has(node.id)}
          isLoading={loadingIds?.has(node.id)}
          currentTenantCode={currentTenantCode}
          onToggle={onToggle}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onPromote={onPromote}
          onDemote={onDemote}
          selectedId={selectedId}
          draggable={draggable}
        />
      ))}
    </div>
  )
}

// ============ Flat List View (for virtualization) ============
interface TaskFlatListProps {
  nodes: FlatNode[]
  currentTenantCode?: string
  selectedId?: string
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  className?: string
}

export function TaskFlatList({
  nodes,
  currentTenantCode,
  selectedId,
  onToggle,
  onSelect,
  className,
}: TaskFlatListProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {nodes.map((node) => {
        const hasChildren = node.hasChildren
        const StatusIcon = STATUS_ICONS[node.status] ?? Circle
        const isSelected = selectedId === node.id
        const isExternal = currentTenantCode && isExternalTask(node.hierarchyCode, currentTenantCode)

        return (
          <div
            key={node.id}
            className={cn(
              "group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
              "hover:bg-accent/50",
              isSelected && "bg-accent",
              PRIORITY_COLORS[node.priority],
              "border-l-2"
            )}
            style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
            onClick={() => onSelect(node.id)}
          >
            {/* Expand Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-5 w-5 p-0 hover:bg-accent", !hasChildren && "invisible")}
              onClick={(e) => {
                e.stopPropagation()
                onToggle(node.id)
              }}
            >
              {node.isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* Status */}
            <StatusIcon className={cn("h-4 w-4", STATUS_COLORS[node.status])} />

            {/* Title */}
            <span
              className={cn(
                "flex-1 truncate text-sm",
                node.status === TASK_STATUS.DONE && "line-through text-muted-foreground"
              )}
            >
              {node.title}
            </span>

            {/* Code */}
            {node.hierarchyCode && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                {node.hierarchyCode}
              </Badge>
            )}
          </div>
        )
      })}
    </div>
  )
}
