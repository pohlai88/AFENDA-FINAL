/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Next-generation document card with mobile-first design
 * Features: thumbnail preview, smart status indicators, quick actions, touch-friendly interactions
 */

"use client"

import { useState, useCallback, useEffect } from "react"
// Using native img for external presigned URLs that can't be optimized by Next.js
import Link from "next/link"
import { cn } from "@afenda/shared/utils"
import { Badge } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Checkbox } from "@afenda/shadcn"
import { Card, CardContent } from "@afenda/shadcn"
import { DocumentActionsDropdown } from "../ui/document-actions-dropdown"
import {
  FileText,
  Download,
  Archive,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useShallow } from "zustand/react/shallow"
import { STATUS } from "@afenda/shared/constants"
import { routes } from "@afenda/shared/constants"
import { useDocumentHubStore } from "@afenda/magicdrive/zustand"
import { useThumbnailCache } from "@afenda/magicdrive/zustand"
import { formatFileSize, formatCompactDate, STATUS_CONFIG } from "@afenda/magicdrive/constant"

// Document type icons mapping
const DOCUMENT_TYPE_ICONS = {
  invoice: FileText,
  contract: FileText,
  receipt: FileText,
  other: FileText,
} as const

// Status icon components (shared STATUS_CONFIG provides color/label; icons mapped locally)
const STATUS_ICONS: Record<string, typeof Clock> = {
  [STATUS.INBOX]: Clock,
  [STATUS.ACTIVE]: CheckCircle,
  [STATUS.ARCHIVED]: Archive,
  [STATUS.DELETED]: XCircle,
}

export interface EnhancedDocumentCardProps {
  document: {
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
  }
  viewMode?: 'card' | 'list' | 'gallery'
  showCheckbox?: boolean
  isSelected?: boolean
  onToggleSelection?: (id: string) => void
  className?: string
}

export function EnhancedDocumentCard({
  document,
  viewMode = 'card',
  showCheckbox = false,
  isSelected = false,
  onToggleSelection,
  className,
}: EnhancedDocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const { setMobile, isMobile } = useDocumentHubStore(
    useShallow((s) => ({ setMobile: s.setMobile, isMobile: s.isMobile }))
  )
  
  // Use thumbnail cache instead of local state
  const { getThumbnail, setThumbnail, isLoading: isThumbnailLoading, setLoading } = useThumbnailCache()
  const cachedThumbnail = getThumbnail(document.id)
  const thumbnailLoading = isThumbnailLoading(document.id)

  // Detect mobile on mount - only once per component instance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMobile(window.innerWidth < 768)
    }
  }, [setMobile])

  // Fetch thumbnail URL only if not in cache
  useEffect(() => {
    if (!document.id || cachedThumbnail !== undefined || thumbnailLoading) {
      return // Skip if already cached or loading
    }

    const fetchThumbnail = async () => {
      setLoading(document.id, true)
      try {
        const res = await fetch(routes.api.v1.magicdrive.objectThumbUrl(document.id), {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          const url = data.data?.url || null
          setThumbnail(document.id, url)
          if (!url) setThumbnailError(true)
        } else {
          setThumbnail(document.id, null)
          setThumbnailError(true)
        }
      } catch {
        setThumbnail(document.id, null)
        setThumbnailError(true)
      }
    }

    void fetchThumbnail()
  }, [document.id, cachedThumbnail, thumbnailLoading, setThumbnail, setLoading])

  const handleCardClick = useCallback(() => {
    if (showCheckbox && onToggleSelection) {
      onToggleSelection(document.id)
    }
  }, [document.id, showCheckbox, onToggleSelection])

  const handleQuickAction = useCallback((e: React.MouseEvent, _action: string) => {
    e.stopPropagation()
    // Handle quick actions (download, share, archive, etc.)
  }, [])

  const statusConfig =
    STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.inbox
  const TypeIcon = DOCUMENT_TYPE_ICONS[document.docType as keyof typeof DOCUMENT_TYPE_ICONS] || FileText
  const StatusIcon = STATUS_ICONS[document.status] ?? Clock
  const isDuplicate =
    document.aiClassifications?.duplicateGroupId != null

  if (viewMode === 'list') {
    return (
      <Card
        className={cn(
          "group hover:shadow-md transition-all duration-200 cursor-pointer",
          isSelected && "ring-2 ring-primary ring-offset-2",
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Checkbox */}
            {showCheckbox && onToggleSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(document.id)}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
            )}

            {/* Document icon/thumbnail */}
            <div className="shrink-0">
              {thumbnailLoading ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted animate-pulse">
                  <TypeIcon className="h-5 w-5 text-muted-foreground/50" />
                </div>
              ) : cachedThumbnail && !thumbnailError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cachedThumbnail}
                  alt={document.title || 'Document'}
                  className="h-10 w-10 rounded object-cover"
                  onError={() => setThumbnailError(true)}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <TypeIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Document info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium text-foreground">
                  {document.title || 'Untitled Document'}
                </h3>
                <Badge className={cn("text-xs", statusConfig.color)}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                {isDuplicate && (
                  <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                    <XCircle className="mr-1 h-3 w-3" />
                    Duplicate
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{document.docType}</span>
                {document.version && (
                  <span>{formatFileSize(document.version.sizeBytes)}</span>
                )}
                <span>{formatCompactDate(document.createdAt)}</span>
                {document.tags && document.tags.length > 0 && (
                  <div className="flex gap-1">
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
              </div>
            </div>

            {/* Quick actions */}
            {(isHovered || isMobile) && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleQuickAction(e, 'view')}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleQuickAction(e, 'download')}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <DocumentActionsDropdown
                  documentId={document.id}
                  documentTitle={document.title}
                  size="sm"
                  actions={['view', 'download', 'share', 'tag', 'archive', 'delete']}
                  onActionComplete={(_action) => {
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Card/Gallery view
  return (
    <Link href={routes.ui.magicdrive.documentById(document.id)}>
      <Card
        className={cn(
          "group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden",
          isSelected && "ring-2 ring-primary ring-offset-2",
          viewMode === 'gallery' ? "aspect-square" : "",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail/Preview */}
        <div className={cn(
          "relative bg-muted",
          viewMode === 'gallery' ? "h-32" : "h-24"
        )}>
          {thumbnailLoading ? (
            <div className="flex h-full w-full items-center justify-center animate-pulse">
              <TypeIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          ) : cachedThumbnail && !thumbnailError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cachedThumbnail}
              alt={document.title || 'Document'}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <TypeIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Status badge overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <Badge className={cn("text-xs", statusConfig.color)}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
            {isDuplicate && (
              <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                <XCircle className="mr-1 h-3 w-3" />
                Duplicate
              </Badge>
            )}
          </div>

          {/* Checkbox overlay */}
          {showCheckbox && onToggleSelection && (
            <div className="absolute top-2 right-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(document.id)}
                onClick={(e) => e.stopPropagation()}
                className="bg-background/80 backdrop-blur-sm"
              />
            </div>
          )}

          {/* Hover actions overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => handleQuickAction(e, 'view')}
                className="bg-white/90 hover:bg-white"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => handleQuickAction(e, 'download')}
                className="bg-white/90 hover:bg-white"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Document info */}
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-medium text-sm leading-tight">
                {document.title || 'Untitled Document'}
              </h3>
              <DocumentActionsDropdown
                documentId={document.id}
                documentTitle={document.title}
                size="sm"
                actions={['view', 'download', 'share', 'tag', 'archive', 'delete']}
                onActionComplete={(_action) => {
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{document.docType}</span>
              {document.version && (
                <span>{formatFileSize(document.version.sizeBytes)}</span>
              )}
            </div>

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

            <div className="text-xs text-muted-foreground">
              {formatCompactDate(document.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
