/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Document preview component with mobile support
 * Features: PDF viewer, image preview, metadata display, download/share actions
 */

"use client"

import { useState, useCallback } from "react"
import { routes } from "@afenda/shared/constants"
import { cn } from "@afenda/shared/utils"
import { toast } from "sonner"
import { Button } from "@afenda/shadcn"
import { CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Separator } from "@afenda/shadcn"
import { ScrollArea } from "@afenda/shadcn"
import { DocumentActionsDropdown } from "../ui/document-actions-dropdown"
import {
  Download,
  Share2,
  Archive,
  FileText,
  ZoomOut,
  ZoomIn,
  RotateCw,
  Maximize2,
  Eye,
  ImageIcon,
} from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"

interface DocumentPreviewProps {
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
  className?: string
  onClose?: () => void
}

export function DocumentPreview({ document, className, onClose }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }, [])

  // Format date
  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'PPP p')
  }, [])

  // Get file icon
  const getFileIcon = useCallback((mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType === 'application/pdf') return FileText
    return FileText
  }, [])

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoom(1)
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Handle actions
  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(routes.api.v1.magicdrive.objectSourceUrl(document.id), {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to get download URL')
      }

      const data = await res.json()
      if (data.data?.url) {
        window.open(data.data.url, '_blank')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      toast.error(message)
      console.error('Failed to download document:', error)
    }
  }, [document.id])

  const handleShare = useCallback(() => {
    // Share API not yet implemented - use clipboard for now
    const shareUrl = `${window.location.origin}${routes.ui.magicdrive.documentById(document.id)}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard')
  }, [document.id])

  const handleArchive = useCallback(async () => {
    try {
      const res = await fetch(routes.api.v1.magicdrive.objectById(document.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'archived' }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Failed to archive document')
      }

      toast.success('Document archived')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Archive failed'
      toast.error(message)
      console.error('Failed to archive document:', error)
    }
  }, [document.id])


  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              {getFileIcon(document.version?.mimeType || '')({ className: "h-5 w-5" })}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate">
                {document.title || 'Untitled Document'}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{document.docType}</span>
                {document.version && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(document.version.sizeBytes)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View controls for images */}
            {document.version?.mimeType?.startsWith('image/') && (
              <div className="flex items-center gap-1 border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomReset}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotate}
                  className="h-8 w-8 p-0"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreen}
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <DocumentActionsDropdown
                documentId={document.id}
                documentTitle={document.title}
                size="sm"
                actions={['view', 'download', 'share', 'tag', 'archive', 'delete']}
                onActionComplete={(_action) => {
                }}
              />
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 p-0">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Preview Area */}
          <div className="flex-1 bg-muted/30 flex items-center justify-center min-h-[400px]">
            {document.preview?.thumbnail ? (
              <div
                className="relative max-w-full max-h-full overflow-hidden"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out'
                }}
              >
                <Image
                  src={document.preview.thumbnail}
                  alt={document.title || 'Document preview'}
                  className="max-w-full max-h-full object-contain"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div className="text-center space-y-4">
                {getFileIcon(document.version?.mimeType || '')({ className: "h-16 w-16 text-muted-foreground mx-auto" })}
                <div className="space-y-2">
                  <h3 className="font-medium">No preview available</h3>
                  <p className="text-sm text-muted-foreground">
                    Preview not available for this file type
                  </p>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download to view
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Sidebar */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l">
            <ScrollArea className="h-full p-4">
              <div className="space-y-6">
                {/* Document Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Document Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{document.docType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">{document.status}</Badge>
                    </div>
                    {document.version && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size:</span>
                          <span className="font-medium">{formatFileSize(document.version.sizeBytes)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">{formatDate(document.createdAt)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Classifications */}
                {document.aiClassifications && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">AI Insights</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className="font-medium">
                          {Math.round(document.aiClassifications.confidence * 100)}%
                        </span>
                      </div>
                      {document.aiClassifications.suggestedTags.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Suggested tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {document.aiClassifications.suggestedTags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                {document.version && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Technical Details</h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground">MIME Type:</span>
                        <div className="break-all">{document.version.mimeType}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SHA256:</span>
                        <div className="break-all">{document.version.sha256}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="w-full justify-start gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="w-full justify-start gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchive}
                      className="w-full justify-start gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
