/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Gallery view for documents using shadcn Card components
 * Features: masonry layout, hover effects, bulk selection, responsive grid
 */

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { cn } from "@afenda/shared/utils"
import { Badge } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Checkbox } from "@afenda/shadcn"
import { Card, CardContent } from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  FileText,
  Download,
  Share2,
  Archive,
  Tag,
  MoreVertical,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Image as ImageIcon,
} from "lucide-react"
import { routes } from "@afenda/shared/constants"
import { formatFileSize, formatCompactDate, STATUS_CONFIG } from "@afenda/magicdrive/constant"

/** Document type → icon mapping */
const DOCUMENT_TYPE_ICONS = {
  invoice: FileText,
  contract: FileText,
  receipt: FileText,
  other: FileText,
} as const

/** Status → icon mapping (labels/colors come from shared STATUS_CONFIG) */
const STATUS_ICONS = {
  needs_review: AlertCircle,
  processed: CheckCircle,
  duplicates: XCircle,
  inbox: Clock,
  active: CheckCircle,
  archived: Archive,
  error: XCircle,
} as const

export interface DocumentGalleryProps {
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

export function DocumentGallery({
  documents,
  selectedIds,
  onToggleSelection,
  className,
}: DocumentGalleryProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [errorStates, setErrorStates] = useState<Record<string, boolean>>({})

  // Track which document IDs we've already requested thumbnails for
  const fetchedRef = useRef<Set<string>>(new Set())

  // Fetch thumbnails — only depends on documents, uses ref to avoid re-triggering
  useEffect(() => {
    const controller = new AbortController()

    documents.forEach(async (doc) => {
      if (!doc.id || fetchedRef.current.has(doc.id)) return
      fetchedRef.current.add(doc.id)

      setLoadingStates(prev => ({ ...prev, [doc.id]: true }))

      try {
        const res = await fetch(routes.api.v1.magicdrive.objectThumbUrl(doc.id), {
          credentials: 'include',
          signal: controller.signal,
        })

        if (res.ok) {
          const data = await res.json()
          if (data.data?.url) {
            setThumbnailUrls(prev => ({ ...prev, [doc.id]: data.data.url }))
          } else {
            setErrorStates(prev => ({ ...prev, [doc.id]: true }))
          }
        } else {
          setErrorStates(prev => ({ ...prev, [doc.id]: true }))
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setErrorStates(prev => ({ ...prev, [doc.id]: true }))
      } finally {
        setLoadingStates(prev => ({ ...prev, [doc.id]: false }))
      }
    })

    return () => controller.abort()
  }, [documents])

  const handleQuickAction = useCallback((e: React.MouseEvent, _action: string, _documentId: string) => {
    e.stopPropagation()
  }, [])

  const handleCardClick = useCallback((documentId: string) => {
    onToggleSelection(documentId)
  }, [onToggleSelection])

  const isImageType = (mimeType?: string) => {
    return mimeType?.startsWith('image/') || false
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {documents.map((document) => {
          const statusConfig = STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.inbox
          const TypeIcon = DOCUMENT_TYPE_ICONS[document.docType as keyof typeof DOCUMENT_TYPE_ICONS] || FileText
          const StatusIcon = STATUS_ICONS[document.status as keyof typeof STATUS_ICONS] ?? Clock
          const isHovered = hoveredCard === document.id
          const isSelected = selectedIds.has(document.id)
          const thumbnailUrl = thumbnailUrls[document.id]
          const isLoading = loadingStates[document.id]
          const hasError = errorStates[document.id]
          const isImage = isImageType(document.version?.mimeType)

          return (
            <Card
              key={document.id}
              className={cn(
                "group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg",
                isSelected && "ring-2 ring-primary ring-offset-2",
                isImage ? "aspect-4/3" : "aspect-square"
              )}
              onMouseEnter={() => setHoveredCard(document.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardClick(document.id)}
            >
              {/* Thumbnail/Preview area */}
              <div className="relative bg-muted">
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  isImage ? "h-48" : "h-32"
                )}>
                  {isLoading ? (
                    <div className="flex h-full w-full items-center justify-center animate-pulse">
                      <TypeIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  ) : thumbnailUrl && !hasError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnailUrl}
                      alt={document.title || 'Document'}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => setErrorStates(prev => ({ ...prev, [document.id]: true }))}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <TypeIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Status badge overlay */}
                <div className="absolute top-2 left-2">
                  <Badge className={cn("text-xs", statusConfig.color)}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Checkbox overlay */}
                <div className="absolute top-2 right-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelection(document.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background/80 backdrop-blur-sm border-background/20"
                  />
                </div>

                {/* Document type indicator */}
                <div className="absolute bottom-2 left-2">
                  <div className="flex items-center gap-1 rounded bg-background/80 backdrop-blur-sm px-2 py-1">
                    <TypeIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground capitalize">
                      {document.docType}
                    </span>
                  </div>
                </div>

                {/* Hover actions overlay */}
                {isHovered && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = routes.ui.magicdrive.documentById(document.id)
                      }}
                      className="bg-white/90 hover:bg-white text-black"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => handleQuickAction(e, 'download', document.id)}
                      className="bg-white/90 hover:bg-white text-black"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <ClientDropdownMenu>
                      <ClientDropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white/90 hover:bg-white text-black"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </ClientDropdownMenuTrigger>
                      <ClientDropdownMenuContent align="end">
                        <ClientDropdownMenuItem onClick={(e) => handleQuickAction(e, 'share', document.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </ClientDropdownMenuItem>
                        <ClientDropdownMenuItem onClick={(e) => handleQuickAction(e, 'tag', document.id)}>
                          <Tag className="mr-2 h-4 w-4" />
                          Add Tags
                        </ClientDropdownMenuItem>
                        <ClientDropdownMenuItem onClick={(e) => handleQuickAction(e, 'archive', document.id)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </ClientDropdownMenuItem>
                      </ClientDropdownMenuContent>
                    </ClientDropdownMenu>
                  </div>
                )}
              </div>

              {/* Document info */}
              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Title */}
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={routes.ui.magicdrive.documentById(document.id)}
                      className="truncate font-medium text-sm leading-tight hover:text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {document.title || 'Untitled Document'}
                    </Link>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCompactDate(document.createdAt)}</span>
                    {document.version && (
                      <span>{formatFileSize(document.version.sizeBytes)}</span>
                    )}
                  </div>

                  {/* Tags */}
                  {document.tags && document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {document.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {document.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{document.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* AI confidence indicator */}
                  {document.aiClassifications && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      <span>AI: {Math.round(document.aiClassifications.confidence * 100)}% confidence</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your filters or upload your first document
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
