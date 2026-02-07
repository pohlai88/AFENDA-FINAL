/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Thumbnail preview view with download functionality
 * Features: Vertical thumbnail layout, batch selection, download progress, shadcn components
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { cn } from "@afenda/shared/utils"
import { Badge } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Checkbox } from "@afenda/shadcn"
import { Card, CardContent } from "@afenda/shadcn"
import { Progress } from "@afenda/shadcn"
import { Spinner } from "@afenda/shadcn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

// Document type icons mapping
const DOCUMENT_TYPE_ICONS = {
  invoice: FileText,
  contract: FileText,
  receipt: FileText,
  other: FileText,
} as const

// Status configuration
const STATUS_CONFIG = {
  needs_review: {
    icon: AlertCircle,
    color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    label: "Needs Review",
  },
  processed: {
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    label: "Processed",
  },
  duplicates: {
    icon: XCircle,
    color: "bg-destructive/10 text-destructive border-destructive/30",
    label: "Duplicate",
  },
  inbox: {
    icon: Clock,
    color: "bg-primary/10 text-primary border-primary/30",
    label: "Inbox",
  },
} as const

export interface ThumbnailPreviewProps {
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

export function ThumbnailPreview({
  documents,
  selectedIds,
  onToggleSelection,
  className,
}: ThumbnailPreviewProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [errorStates, setErrorStates] = useState<Record<string, boolean>>({})
  const [downloadStates, setDownloadStates] = useState<Record<string, { loading: boolean; progress: number }>>({})

  // Fetch thumbnails for all documents
  useEffect(() => {
    documents.forEach(async (document) => {
      if (!document.id || thumbnailUrls[document.id] || errorStates[document.id]) return

      setLoadingStates(prev => ({ ...prev, [document.id]: true }))

      try {
        const res = await fetch(routes.api.v1.magicdrive.objectThumbUrl(document.id), {
          credentials: 'include',
        })

        if (res.ok) {
          const data = await res.json()
          if (data.data?.url) {
            setThumbnailUrls(prev => ({ ...prev, [document.id]: data.data.url }))
          } else {
            setErrorStates(prev => ({ ...prev, [document.id]: true }))
          }
        } else {
          setErrorStates(prev => ({ ...prev, [document.id]: true }))
        }
      } catch {
        setErrorStates(prev => ({ ...prev, [document.id]: true }))
      } finally {
        setLoadingStates(prev => ({ ...prev, [document.id]: false }))
      }
    })
  }, [documents, thumbnailUrls, errorStates])

  const handleQuickAction = useCallback((e: React.MouseEvent, action: string, documentId: string) => {
    e.stopPropagation()
  }, [])

  const handleDownload = useCallback(async (documentId: string, documentTitle: string) => {
    setDownloadStates(prev => ({
      ...prev,
      [documentId]: { loading: true, progress: 0 }
    }))

    try {
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setDownloadStates(prev => ({
          ...prev,
          [documentId]: { ...prev[documentId], progress: i }
        }))
      }

      // Get source URL for download
      const res = await fetch(routes.api.v1.magicdrive.objectSourceUrl(documentId), {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data?.url) {
          // Create download link
          const link = document.createElement('a')
          link.href = data.data.url
          link.download = documentTitle || 'document'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      // Reset download state after completion
      setTimeout(() => {
        setDownloadStates(prev => {
          const newState = { ...prev }
          delete newState[documentId]
          return newState
        })
      }, 1000)
    }
  }, [])

  const handleBulkDownload = useCallback(async () => {
    const selectedDocs = documents.filter(doc => selectedIds.has(doc.id))

    for (const doc of selectedDocs) {
      await handleDownload(doc.id, doc.title || 'document')
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }, [documents, selectedIds, handleDownload])

  const handleCardClick = useCallback((documentId: string) => {
    onToggleSelection(documentId)
  }, [onToggleSelection])

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  // Check if document is an image type
  const isImageType = (mimeType?: string) => {
    return mimeType?.startsWith('image/') || false
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Bulk Download Controls */}
      {selectedIds.size > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedIds.size} selected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Ready for download
                </span>
              </div>
              <Button onClick={handleBulkDownload} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thumbnail Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {documents.map((document) => {
          const statusConfig = STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.inbox
          const TypeIcon = DOCUMENT_TYPE_ICONS[document.docType as keyof typeof DOCUMENT_TYPE_ICONS] || FileText
          const StatusIcon = statusConfig.icon
          const isHovered = hoveredCard === document.id
          const isSelected = selectedIds.has(document.id)
          const thumbnailUrl = thumbnailUrls[document.id]
          const isLoading = loadingStates[document.id]
          const hasError = errorStates[document.id]
          const isImage = isImageType(document.version?.mimeType)
          const downloadState = downloadStates[document.id]

          return (
            <Card
              key={document.id}
              className={cn(
                "group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg",
                isSelected && "ring-2 ring-primary ring-offset-2",
                "aspect-3/4" // Vertical aspect ratio for thumbnail preview
              )}
              onMouseEnter={() => setHoveredCard(document.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardClick(document.id)}
            >
              {/* Thumbnail/Preview area */}
              <div className="relative bg-muted h-48">
                <div className="absolute inset-0 flex items-center justify-center">
                  {isLoading ? (
                    <Spinner className="h-8 w-8" />
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

                {/* Download progress overlay */}
                {downloadState?.loading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                    <Spinner className="h-6 w-6 text-white" />
                    <div className="w-32">
                      <Progress value={downloadState.progress} className="w-full" />
                    </div>
                    <span className="text-white text-xs">{downloadState.progress}%</span>
                  </div>
                )}

                {/* Hover actions overlay */}
                {isHovered && !downloadState?.loading && (
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
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(document.id, document.title || 'document')
                      }}
                      className="bg-white/90 hover:bg-white text-black"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white/90 hover:bg-white text-black"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'share', document.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'tag', document.id)}>
                          <Tag className="mr-2 h-4 w-4" />
                          Add Tags
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'archive', document.id)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    <span className="capitalize">{document.docType}</span>
                    {document.version && (
                      <span>{formatFileSize(document.version.sizeBytes)}</span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-muted-foreground">
                    {formatDate(document.createdAt)}
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
