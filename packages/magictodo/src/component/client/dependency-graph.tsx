/**
 * @domain magictodo
 * @layer ui
 * @responsibility Visual dependency chain component for task relationships
 * Dependency Graph - Interactive visualization of task dependencies
 */

"use client"

import { useMemo, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn"
import {
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Target,
  Clock,
  Link2,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"

// ============ Types ============
export interface DependencyNode {
  id: string
  title: string
  status: "todo" | "in-progress" | "completed" | "blocked"
  priority?: "low" | "medium" | "high" | "urgent"
  dueDate?: Date
  dependencies: string[] // IDs of tasks this depends on
  dependents: string[] // IDs of tasks that depend on this
}

export interface DependencyEdge {
  from: string
  to: string
  type: "blocks" | "blocked-by"
  isCircular?: boolean
}

interface GraphLayout {
  nodes: Map<
    string,
    { x: number; y: number; level: number; column: number }
  >
  edges: DependencyEdge[]
  levels: number
  maxWidth: number
}

// ============ Layout Algorithm ============
function calculateLayout(nodes: DependencyNode[]): GraphLayout {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const positions = new Map<string, { x: number; y: number; level: number; column: number }>()
  const visited = new Set<string>()
  const levels = new Map<string, number>()

  // Find root nodes (no dependencies)
  const roots = nodes.filter((n) => n.dependencies.length === 0)

  // Calculate levels using BFS
  function assignLevels(nodeId: string, level: number): void {
    if (visited.has(nodeId)) {
      const existingLevel = levels.get(nodeId) || 0
      if (level <= existingLevel) return
    }
    visited.add(nodeId)
    levels.set(nodeId, Math.max(levels.get(nodeId) || 0, level))

    const node = nodeMap.get(nodeId)
    if (!node) return

    node.dependents.forEach((depId) => {
      assignLevels(depId, level + 1)
    })
  }

  roots.forEach((root) => assignLevels(root.id, 0))

  // Handle disconnected nodes
  nodes.forEach((node) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0)
    }
  })

  // Group nodes by level
  const levelGroups = new Map<number, string[]>()
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level)!.push(nodeId)
  })

  // Calculate positions
  const nodeWidth = 180
  const nodeHeight = 80
  const horizontalGap = 40
  const verticalGap = 60
  let maxWidth = 0

  levelGroups.forEach((nodeIds, level) => {
    const groupWidth = nodeIds.length * nodeWidth + (nodeIds.length - 1) * horizontalGap
    maxWidth = Math.max(maxWidth, groupWidth)

    nodeIds.forEach((nodeId, column) => {
      positions.set(nodeId, {
        x: column * (nodeWidth + horizontalGap),
        y: level * (nodeHeight + verticalGap),
        level,
        column,
      })
    })
  })

  // Center each level
  levelGroups.forEach((nodeIds, _level) => {
    const groupWidth = nodeIds.length * nodeWidth + (nodeIds.length - 1) * horizontalGap
    const offset = (maxWidth - groupWidth) / 2

    nodeIds.forEach((nodeId) => {
      const pos = positions.get(nodeId)!
      pos.x += offset
    })
  })

  // Generate edges
  const edges: DependencyEdge[] = []
  const edgeSet = new Set<string>()

  nodes.forEach((node) => {
    node.dependencies.forEach((depId) => {
      const edgeKey = `${depId}->${node.id}`
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        edges.push({
          from: depId,
          to: node.id,
          type: "blocks",
        })
      }
    })
  })

  return {
    nodes: positions,
    edges,
    levels: Math.max(...Array.from(levels.values())) + 1,
    maxWidth,
  }
}

// ============ Circular Dependency Detection ============
function detectCircularDependencies(nodes: DependencyNode[]): Set<string> {
  const circular = new Set<string>()
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  function dfs(nodeId: string, path: Set<string>): boolean {
    if (path.has(nodeId)) {
      path.forEach((id) => circular.add(id))
      return true
    }

    const node = nodeMap.get(nodeId)
    if (!node) return false

    path.add(nodeId)

    for (const depId of node.dependents) {
      if (dfs(depId, path)) {
        circular.add(nodeId)
      }
    }

    path.delete(nodeId)
    return false
  }

  nodes.forEach((node) => {
    dfs(node.id, new Set())
  })

  return circular
}

// ============ Node Component ============
interface DependencyNodeCardProps {
  node: DependencyNode
  position: { x: number; y: number }
  isSelected: boolean
  isCircular: boolean
  isBlocked: boolean
  onSelect: (id: string) => void
  onNavigate?: (id: string) => void
}

function DependencyNodeCard({
  node,
  position,
  isSelected,
  isCircular,
  isBlocked,
  onSelect,
  onNavigate,
}: DependencyNodeCardProps) {
  const statusConfig = {
    "todo": { icon: Circle, color: "text-gray-400", bg: "bg-gray-100" },
    "in-progress": { icon: Clock, color: "text-blue-500", bg: "bg-blue-100" },
    "completed": { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-100" },
    "blocked": { icon: Lock, color: "text-red-500", bg: "bg-red-100" },
  }

  const priorityColors = {
    low: "bg-gray-200",
    medium: "bg-yellow-200",
    high: "bg-orange-200",
    urgent: "bg-red-200",
  }

  const config = statusConfig[node.status]
  const StatusIcon = config.icon

  return (
    <div
      className={cn(
        "absolute w-44 p-3 rounded-lg border-2 cursor-pointer transition-all",
        "hover:shadow-md hover:scale-105",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-muted bg-card",
        isCircular && "border-red-500 bg-red-50",
        isBlocked && !isCircular && "border-yellow-500 bg-yellow-50"
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(0, 0)",
      }}
      onClick={() => onSelect(node.id)}
      onDoubleClick={() => onNavigate?.(node.id)}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1 rounded-full", config.bg)}>
          <StatusIcon className={cn("h-3 w-3", config.color)} />
        </div>
        <span className="text-xs text-muted-foreground capitalize">
          {node.status.replace("-", " ")}
        </span>
        {node.priority && (
          <Badge
            variant="outline"
            className={cn("text-xs ml-auto", priorityColors[node.priority])}
          >
            {node.priority[0]!.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium line-clamp-2" title={node.title}>
        {node.title}
      </p>

      {/* Dependency counts */}
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        {node.dependencies.length > 0 && (
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            {node.dependencies.length} blocking
          </span>
        )}
        {node.dependents.length > 0 && (
          <span className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            {node.dependents.length} dependent
          </span>
        )}
      </div>

      {/* Warning badges */}
      {isCircular && (
        <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Circular
        </Badge>
      )}
      {isBlocked && !isCircular && (
        <Badge variant="outline" className="absolute -top-2 -right-2 text-xs bg-yellow-100">
          <Lock className="h-3 w-3 mr-1" />
          Blocked
        </Badge>
      )}
    </div>
  )
}

// ============ Edge SVG Component ============
interface DependencyEdgeSVGProps {
  layout: GraphLayout
  edges: DependencyEdge[]
  selectedNodeId: string | null
  circularNodes: Set<string>
}

function DependencyEdgeSVG({
  layout,
  edges,
  selectedNodeId,
  circularNodes,
}: DependencyEdgeSVGProps) {
  const nodeWidth = 176
  const nodeHeight = 80

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="currentColor"
            className="text-muted-foreground"
          />
        </marker>
        <marker
          id="arrowhead-selected"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
        </marker>
        <marker
          id="arrowhead-circular"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="rgb(239, 68, 68)" />
        </marker>
      </defs>

      {edges.map((edge, index) => {
        const fromPos = layout.nodes.get(edge.from)
        const toPos = layout.nodes.get(edge.to)

        if (!fromPos || !toPos) return null

        const startX = fromPos.x + nodeWidth / 2
        const startY = fromPos.y + nodeHeight
        const endX = toPos.x + nodeWidth / 2
        const endY = toPos.y

        const isSelected = selectedNodeId === edge.from || selectedNodeId === edge.to
        const isCircular = circularNodes.has(edge.from) && circularNodes.has(edge.to)

        // Bezier curve control points
        const midY = (startY + endY) / 2
        const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`

        return (
          <path
            key={`${edge.from}-${edge.to}-${index}`}
            d={path}
            fill="none"
            strokeWidth={isSelected ? 2.5 : 1.5}
            className={cn(
              isCircular
                ? "stroke-red-500"
                : isSelected
                ? "stroke-primary"
                : "stroke-muted-foreground/40"
            )}
            markerEnd={`url(#${
              isCircular
                ? "arrowhead-circular"
                : isSelected
                ? "arrowhead-selected"
                : "arrowhead"
            })`}
            style={{
              transition: "stroke-width 0.2s, stroke 0.2s",
            }}
          />
        )
      })}
    </svg>
  )
}

// ============ Main Component ============
interface DependencyGraphProps {
  nodes: DependencyNode[]
  selectedTaskId?: string
  onSelectTask?: (id: string) => void
  onNavigateToTask?: (id: string) => void
  className?: string
  showControls?: boolean
}

export function DependencyGraph({
  nodes,
  selectedTaskId,
  onSelectTask,
  onNavigateToTask,
  className,
  showControls = true,
}: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const layout = useMemo(() => calculateLayout(nodes), [nodes])
  const circularNodes = useMemo(() => detectCircularDependencies(nodes), [nodes])

  // Find blocked nodes (depend on incomplete tasks)
  const blockedNodes = useMemo(() => {
    const blocked = new Set<string>()
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    nodes.forEach((node) => {
      if (node.status === "completed") return

      const hasBlockingDep = node.dependencies.some((depId) => {
        const dep = nodeMap.get(depId)
        return dep && dep.status !== "completed"
      })

      if (hasBlockingDep) {
        blocked.add(node.id)
      }
    })

    return blocked
  }, [nodes])

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.4))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  if (nodes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No dependencies to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Dependency Graph
          <Badge variant="outline" className="ml-2">
            {nodes.length} tasks
          </Badge>
          {circularNodes.size > 0 && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {circularNodes.size} circular
            </Badge>
          )}
        </CardTitle>

        {showControls && (
          <div className="flex items-center gap-1">
            <ClientTooltipProvider>
              <ClientTooltip>
                <ClientTooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </ClientTooltipTrigger>
                <ClientTooltipContent>Zoom out</ClientTooltipContent>
              </ClientTooltip>
            </ClientTooltipProvider>

            <span className="text-xs text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>

            <ClientTooltipProvider>
              <ClientTooltip>
                <ClientTooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </ClientTooltipTrigger>
                <ClientTooltipContent>Zoom in</ClientTooltipContent>
              </ClientTooltip>
            </ClientTooltipProvider>

            <ClientTooltipProvider>
              <ClientTooltip>
                <ClientTooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleReset}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </ClientTooltipTrigger>
                <ClientTooltipContent>Reset view</ClientTooltipContent>
              </ClientTooltip>
            </ClientTooltipProvider>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className={cn(
            "relative h-96 overflow-hidden bg-muted/20",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="relative"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top left",
              width: layout.maxWidth + 200,
              height: layout.levels * 140 + 100,
              padding: 40,
            }}
          >
            {/* Edges */}
            <DependencyEdgeSVG
              layout={layout}
              edges={layout.edges}
              selectedNodeId={selectedTaskId ?? null}
              circularNodes={circularNodes}
            />

            {/* Nodes */}
            {nodes.map((node) => {
              const position = layout.nodes.get(node.id)
              if (!position) return null

              return (
                <DependencyNodeCard
                  key={node.id}
                  node={node}
                  position={{ x: position.x, y: position.y }}
                  isSelected={selectedTaskId === node.id}
                  isCircular={circularNodes.has(node.id)}
                  isBlocked={blockedNodes.has(node.id)}
                  onSelect={onSelectTask || (() => {})}
                  onNavigate={onNavigateToTask}
                />
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============ Mini Graph Component ============
interface MiniDependencyGraphProps {
  nodes: DependencyNode[]
  focusNodeId: string
  className?: string
}

export function MiniDependencyGraph({
  nodes,
  focusNodeId,
  className,
}: MiniDependencyGraphProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const focusNode = nodeMap.get(focusNodeId)

  if (!focusNode) return null

  // Get immediate dependencies and dependents
  const immediateDeps = focusNode.dependencies
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as DependencyNode[]

  const immediateDependents = focusNode.dependents
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as DependencyNode[]

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {/* Blocking tasks */}
      {immediateDeps.length > 0 && (
        <div className="flex items-center gap-1">
          {immediateDeps.slice(0, 2).map((dep) => (
            <Badge key={dep.id} variant="outline" className="text-xs">
              {dep.status === "completed" ? (
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <Lock className="h-3 w-3 mr-1 text-yellow-500" />
              )}
              {dep.title.slice(0, 15)}
              {dep.title.length > 15 && "..."}
            </Badge>
          ))}
          {immediateDeps.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{immediateDeps.length - 2}
            </Badge>
          )}
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Current task */}
      <Badge variant="secondary" className="font-medium">
        <Target className="h-3 w-3 mr-1" />
        Current
      </Badge>

      {/* Dependent tasks */}
      {immediateDependents.length > 0 && (
        <div className="flex items-center gap-1">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          {immediateDependents.slice(0, 2).map((dep) => (
            <Badge key={dep.id} variant="outline" className="text-xs">
              <Link2 className="h-3 w-3 mr-1" />
              {dep.title.slice(0, 15)}
              {dep.title.length > 15 && "..."}
            </Badge>
          ))}
          {immediateDependents.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{immediateDependents.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// ============ Hook ============
export function useDependencyAnalysis(nodes: DependencyNode[]) {
  return useMemo(() => {
    const circular = detectCircularDependencies(nodes)
    const layout = calculateLayout(nodes)

    const blocked = new Set<string>()
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    nodes.forEach((node) => {
      if (node.status === "completed") return
      const hasBlockingDep = node.dependencies.some((depId) => {
        const dep = nodeMap.get(depId)
        return dep && dep.status !== "completed"
      })
      if (hasBlockingDep) blocked.add(node.id)
    })

    return {
      circularNodes: circular,
      blockedNodes: blocked,
      layout,
      hasCircularDependencies: circular.size > 0,
      blockedCount: blocked.size,
      totalDependencies: nodes.reduce((sum, n) => sum + n.dependencies.length, 0),
    }
  }, [nodes])
}
