/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Relationship view - Document network map and connection visualization
 * Features: Interactive graph, relationship clustering, connection paths, network analysis
 */

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { cn } from "@afenda/shared/utils"
import { Badge } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Card, CardContent } from "@afenda/shadcn"
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn"
import {
  FileText,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Network,
  Zap,
  Link2,
  Users,
  Folder,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { routes } from "@afenda/shared/constants"
import { formatFileSize, STATUS_CONFIG } from "@afenda/magicdrive/constant"

// Document type icons mapping
const DOCUMENT_TYPE_ICONS = {
  invoice: FileText,
  contract: FileText,
  receipt: FileText,
  other: FileText,
} as const

// Status icon components (shared STATUS_CONFIG provides color/label; icons mapped locally)
const STATUS_ICONS: Record<string, typeof AlertCircle> = {
  needs_review: AlertCircle,
  processed: CheckCircle,
  duplicates: XCircle,
  inbox: Clock,
}

// Relationship types
const RELATIONSHIP_TYPES = {
  duplicate: { color: '#ef4444', label: 'Duplicate', icon: Link2 },
  same_tags: { color: '#3b82f6', label: 'Same Tags', icon: Tag },
  similar_content: { color: '#10b981', label: 'Similar Content', icon: Zap },
  same_source: { color: '#8b5cf6', label: 'Same Source', icon: Users },
  same_type: { color: '#f59e0b', label: 'Same Type', icon: Folder },
} as const

export interface RelationshipViewProps {
  documents: Array<{
    id: string
    title: string | null
    docType: string
    status: string
    createdAt: string
    tags?: { id: string; name: string; slug: string }[]
    version?: {
      id: string
      mimeType: string
      sizeBytes: number
      sha256: string
    }
    preview?: {
      thumbnail?: string
      extracted?: string
    }
    aiClassifications?: {
      confidence: number
      suggestedTags: string[]
      duplicateGroupId?: string
    }
  }>
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  className?: string
}

interface Node {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- document properties are dynamically accessed (aiClassifications, tags, etc.)
  document: any
  x: number
  y: number
  vx: number
  vy: number
  connections: number
}

interface Edge {
  source: string
  target: string
  type: keyof typeof RELATIONSHIP_TYPES
  strength: number
}

export function RelationshipView({
  documents,
  selectedIds,
  onToggleSelection,
  className,
}: RelationshipViewProps) {
  const [centerNode, setCenterNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedRelationship, setSelectedRelationship] = useState<string>('all')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  // Calculate relationships between documents
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- docs items are indexed/spread for dynamic property access
  const calculateRelationships = useCallback((docs: any[]) => {
    const newEdges: Edge[] = []
    const _relationshipStrengths = new Map<string, number>()

    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const doc1 = docs[i]
        const doc2 = docs[j]
        let relationshipType: keyof typeof RELATIONSHIP_TYPES | null = null
        let strength = 0

        // Check for duplicates
        if (doc1.aiClassifications?.duplicateGroupId &&
          doc1.aiClassifications.duplicateGroupId === doc2.aiClassifications?.duplicateGroupId) {
          relationshipType = 'duplicate'
          strength = 0.9
        }
        // Check for same tags
        else if (doc1.tags && doc2.tags) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tag objects are untyped; properties accessed via .id
          const commonTags = doc1.tags.filter((tag1: any) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tag objects are untyped; properties accessed via .id
            doc2.tags.some((tag2: any) => tag1.id === tag2.id)
          )
          if (commonTags.length > 0) {
            relationshipType = 'same_tags'
            strength = commonTags.length / Math.max(doc1.tags.length, doc2.tags.length)
          }
        }
        // Check for same type
        else if (doc1.docType === doc2.docType) {
          relationshipType = 'same_type'
          strength = 0.3
        }
        // Check for similar content (simplified - using AI confidence)
        else if (doc1.aiClassifications && doc2.aiClassifications) {
          const confidence1 = doc1.aiClassifications.confidence
          const confidence2 = doc2.aiClassifications.confidence
          if (Math.abs(confidence1 - confidence2) < 0.1) {
            relationshipType = 'similar_content'
            strength = Math.max(confidence1, confidence2)
          }
        }

        if (relationshipType && strength > 0.2) {
          newEdges.push({
            source: doc1.id,
            target: doc2.id,
            type: relationshipType,
            strength
          })
        }
      }
    }

    return newEdges
  }, [])

  // Initialize nodes and edges
  useEffect(() => {
    const newEdges = calculateRelationships(documents)
    const filteredEdges = selectedRelationship === 'all'
      ? newEdges
      : newEdges.filter(edge => edge.type === selectedRelationship)

    // Create nodes with positions
    const centerX = 400
    const centerY = 300
    const newNodes: Node[] = documents.map((doc, index) => {
      const angle = (index / documents.length) * 2 * Math.PI
      const radius = 150 + Math.random() * 100
      return {
        id: doc.id,
        document: doc,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        connections: filteredEdges.filter(edge => edge.source === doc.id || edge.target === doc.id).length
      }
    })

    // eslint-disable-next-line react-hooks/set-state-in-effect -- computing graph layout from documents requires effect
    setNodes(newNodes)
    setEdges(filteredEdges)
  }, [documents, calculateRelationships, selectedRelationship])

  // Optimized force simulation with throttling and convergence detection
  useEffect(() => {
    if (documents.length === 0) return
    
    let animationFrameId: number
    let lastTime = 0
    const FPS = 20 // Throttle to 20fps for better performance
    let converged = false

    const simulate = (currentTime: number) => {
      if (currentTime - lastTime >= 1000 / FPS) {
        setNodes(prevNodes => {
          if (converged) return prevNodes // Stop if simulation has converged
          
          const newNodes = [...prevNodes]
          const centerX = 400
          const centerY = 300
          let maxVelocity = 0

          // Apply forces
          newNodes.forEach((node, i) => {
            // Center attraction
            const dx = centerX - node.x
            const dy = centerY - node.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance > 0) {
              node.vx += dx / distance * 0.01
              node.vy += dy / distance * 0.01
            }

            // Repulsion between nodes
            newNodes.forEach((other, j) => {
              if (i !== j) {
                const dx = node.x - other.x
                const dy = node.y - other.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance < 100 && distance > 0) {
                  node.vx += dx / distance * 2
                  node.vy += dy / distance * 2
                }
              }
            })

            // Apply velocity with damping
            node.x += node.vx
            node.y += node.vy
            node.vx *= 0.9
            node.vy *= 0.9

            // Track max velocity for convergence detection
            const velocity = Math.abs(node.vx) + Math.abs(node.vy)
            if (velocity > maxVelocity) maxVelocity = velocity

            // Keep within bounds
            node.x = Math.max(50, Math.min(750, node.x))
            node.y = Math.max(50, Math.min(550, node.y))
          })

          // Check for convergence (stop animating when movement is minimal)
          if (maxVelocity < 0.01) {
            converged = true
          }

          return newNodes
        })
        lastTime = currentTime
      }
      
      if (!converged) {
        animationFrameId = requestAnimationFrame(simulate)
      }
    }

    animationFrameId = requestAnimationFrame(simulate)
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [documents.length]) // Re-run when document count changes

  const handleNodeClick = useCallback((nodeId: string) => {
    setCenterNode(nodeId === centerNode ? null : nodeId)
    onToggleSelection(nodeId)
  }, [centerNode, onToggleSelection])

  const _handleQuickAction = useCallback((e: React.MouseEvent, _action: string, _documentId: string) => {
    e.stopPropagation()
  }, [])

  const getNodeSize = (connections: number) => {
    return Math.max(20, Math.min(40, 20 + connections * 5))
  }

  const getNodeColor = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    return config?.color.replace(/text-|bg-|border-/, '').split(' ')[0] || '#6b7280'
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Relationship Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Relationship Type:</span>
                <ClientSelect value={selectedRelationship} onValueChange={setSelectedRelationship}>
                  <ClientSelectTrigger className="w-40">
                    <ClientSelectValue />
                  </ClientSelectTrigger>
                  <ClientSelectContent>
                    <ClientSelectItem value="all">All Relationships</ClientSelectItem>
                    {Object.entries(RELATIONSHIP_TYPES).map(([key, config]) => (
                      <ClientSelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }}></div>
                          {config.label}
                        </div>
                      </ClientSelectItem>
                    ))}
                  </ClientSelectContent>
                </ClientSelect>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{documents.length} documents</span>
              <span>•</span>
              <span>{edges.length} relationships</span>
              {selectedIds.size > 0 && (
                <>
                  <span>•</span>
                  <Badge variant="secondary">{selectedIds.size} selected</Badge>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Visualization */}
      <Card>
        <CardContent className="p-6">
          <div className="relative overflow-hidden rounded-lg border bg-muted/20" style={{ height: '600px' }}>
            <svg
              ref={svgRef}
              width="800"
              height="600"
              className="w-full h-full"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
            >
              {/* Edges */}
              {edges.map((edge, index) => {
                const sourceNode = nodes.find(n => n.id === edge.source)
                const targetNode = nodes.find(n => n.id === edge.target)
                if (!sourceNode || !targetNode) return null

                const relationshipConfig = RELATIONSHIP_TYPES[edge.type]
                const isHighlighted = centerNode === edge.source || centerNode === edge.target

                return (
                  <g key={index}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={relationshipConfig.color}
                      strokeWidth={isHighlighted ? 3 : 1 + edge.strength * 2}
                      strokeOpacity={isHighlighted ? 1 : 0.3 + edge.strength * 0.4}
                    />
                    {isHighlighted && (
                      <text
                        x={(sourceNode.x + targetNode.x) / 2}
                        y={(sourceNode.y + targetNode.y) / 2}
                        fill={relationshipConfig.color}
                        fontSize="10"
                        textAnchor="middle"
                        className="font-medium"
                      >
                        {relationshipConfig.label}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedIds.has(node.id)
                const isHovered = hoveredNode === node.id
                const isCenter = centerNode === node.id
                const nodeSize = getNodeSize(node.connections)
                const nodeColor = getNodeColor(node.document.status)

                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeSize}
                      fill={nodeColor}
                      stroke={isSelected ? '#000' : '#fff'}
                      strokeWidth={isSelected ? 3 : 2}
                      opacity={isCenter ? 1 : isHovered ? 0.9 : 0.7}
                      className="cursor-pointer transition-all"
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    {isCenter && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeSize + 5}
                        fill="none"
                        stroke="#000"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="animate-pulse"
                      />
                    )}
                    <text
                      x={node.x}
                      y={node.y + nodeSize + 15}
                      fill="#000"
                      fontSize="10"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {node.document.title?.slice(0, 15) || 'Untitled'}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Document Details Panel */}
      {centerNode && (
        <Card>
          <CardContent className="p-4">
            {(() => {
              const centerDoc = documents.find(doc => doc.id === centerNode)
              if (!centerDoc) return null

              const TypeIcon = DOCUMENT_TYPE_ICONS[centerDoc.docType as keyof typeof DOCUMENT_TYPE_ICONS] || FileText
              const StatusIcon = STATUS_ICONS[centerDoc.status] || Clock
              const statusColor = STATUS_CONFIG[centerDoc.status as keyof typeof STATUS_CONFIG]?.color || STATUS_CONFIG.inbox.color
              const connections = edges.filter(edge => edge.source === centerNode || edge.target === centerNode)

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Document Details</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCenterNode(null)}
                    >
                      ×
                    </Button>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <TypeIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <Link
                        href={routes.ui.magicdrive.documentById(centerNode)}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {centerDoc.title || 'Untitled Document'}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-xs", statusColor)}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {STATUS_CONFIG[centerDoc.status as keyof typeof STATUS_CONFIG]?.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground capitalize">
                          {centerDoc.docType}
                        </span>
                        {centerDoc.version && (
                          <span className="text-sm text-muted-foreground">
                            {formatFileSize(centerDoc.version.sizeBytes)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Connections ({connections.length})</h4>
                    <div className="space-y-2">
                      {connections.map((edge, index) => {
                        const otherDocId = edge.source === centerNode ? edge.target : edge.source
                        const otherDoc = documents.find(doc => doc.id === otherDocId)
                        if (!otherDoc) return null

                        const relationshipConfig = RELATIONSHIP_TYPES[edge.type]

                        return (
                          <div key={index} className="flex items-center gap-2 p-2 rounded border">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: relationshipConfig.color }}></div>
                            <span className="text-sm">{relationshipConfig.label}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <Link
                              href={routes.ui.magicdrive.documentById(otherDocId)}
                              className="text-sm hover:text-primary hover:underline"
                            >
                              {otherDoc.title || 'Untitled Document'}
                            </Link>
                            <Badge variant="outline" className="text-xs ml-auto">
                              {Math.round(edge.strength * 100)}%
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Network className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents to connect</h3>
            <p className="text-muted-foreground text-center">
              Upload documents to see their relationships and connections
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
