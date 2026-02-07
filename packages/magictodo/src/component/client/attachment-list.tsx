/**
 * AttachmentList Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Display and manage task file attachments
 */

"use client"

import { useState, useCallback } from "react"
import { Button, Badge } from "@afenda/shadcn"
import { cn } from "@afenda/shared/utils"
import {
  Paperclip,
  Trash2,
  Download,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileArchive,
  FileVideo,
  FileAudio,
  File,
  Loader2,
  Upload,
  ExternalLink,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { TaskAttachment } from "@afenda/magictodo/zod"

export interface AttachmentListProps {
  taskId: string
  attachments: TaskAttachment[]
  isLoading?: boolean
  onAddAttachment?: (file: File) => Promise<void>
  onRemoveAttachment?: (attachmentId: string) => Promise<void>
  onDownloadAttachment?: (attachment: TaskAttachment) => void
  onPreviewAttachment?: (attachment: TaskAttachment) => void
  readonly?: boolean
  maxFileSize?: number // bytes, default 10MB
  acceptedTypes?: string[] // e.g., ["image/*", "application/pdf"]
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
  if (mimeType.startsWith("video/")) return <FileVideo className="h-4 w-4" />
  if (mimeType.startsWith("audio/")) return <FileAudio className="h-4 w-4" />
  if (mimeType.includes("pdf")) return <FileText className="h-4 w-4" />
  if (mimeType.includes("zip") || mimeType.includes("archive") || mimeType.includes("compressed")) {
    return <FileArchive className="h-4 w-4" />
  }
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("html") ||
    mimeType.includes("css")
  ) {
    return <FileCode className="h-4 w-4" />
  }
  if (
    mimeType.includes("text") ||
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  ) {
    return <FileText className="h-4 w-4" />
  }
  return <File className="h-4 w-4" />
}

function getFileColor(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "text-green-600 dark:text-green-400"
  if (mimeType.startsWith("video/")) return "text-purple-600 dark:text-purple-400"
  if (mimeType.startsWith("audio/")) return "text-pink-600 dark:text-pink-400"
  if (mimeType.includes("pdf")) return "text-red-600 dark:text-red-400"
  if (mimeType.includes("zip") || mimeType.includes("archive")) return "text-amber-600 dark:text-amber-400"
  if (mimeType.includes("javascript") || mimeType.includes("typescript")) return "text-yellow-600 dark:text-yellow-400"
  return "text-blue-600 dark:text-blue-400"
}

export function AttachmentList({
  taskId: _taskId,
  attachments,
  isLoading = false,
  onAddAttachment,
  onRemoveAttachment,
  onDownloadAttachment,
  onPreviewAttachment,
  readonly = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes,
}: AttachmentListProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File is too large. Max size is ${formatFileSize(maxFileSize)}`
      }
      if (acceptedTypes && acceptedTypes.length > 0) {
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith("/*")) {
            const prefix = type.slice(0, -2)
            return file.type.startsWith(prefix)
          }
          return file.type === type
        })
        if (!isAccepted) {
          return "File type not accepted"
        }
      }
      return null
    },
    [maxFileSize, acceptedTypes]
  )

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !onAddAttachment) return

      const file = files[0]
      const error = validateFile(file)
      if (error) {
        setUploadError(error)
        return
      }

      setUploadError(null)
      setIsUploading(true)
      try {
        await onAddAttachment(file)
      } catch {
        setUploadError("Failed to upload file")
      } finally {
        setIsUploading(false)
      }
    },
    [onAddAttachment, validateFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  const handleRemove = useCallback(
    async (attachmentId: string) => {
      if (!onRemoveAttachment) return
      if (window.confirm("Remove this attachment?")) {
        await onRemoveAttachment(attachmentId)
      }
    },
    [onRemoveAttachment]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading attachments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </h4>
      </div>

      {/* Attachment list */}
      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
            >
              {/* File icon */}
              <div
                className={cn(
                  "flex-shrink-0 p-1.5 rounded-md bg-muted",
                  getFileColor(attachment.mimeType)
                )}
              >
                {getFileIcon(attachment.mimeType)}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{attachment.filename}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(attachment.size)}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(attachment.uploadedAt), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onPreviewAttachment && attachment.mimeType.startsWith("image/") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onPreviewAttachment(attachment)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="sr-only">Preview</span>
                  </Button>
                )}
                {onDownloadAttachment && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDownloadAttachment(attachment)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="sr-only">Download</span>
                  </Button>
                )}
                {!readonly && onRemoveAttachment && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(attachment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Remove</span>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {attachments.length === 0 && readonly && (
        <p className="text-sm text-muted-foreground text-center py-2">No attachments</p>
      )}

      {/* Upload zone */}
      {!readonly && onAddAttachment && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-4 transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept={acceptedTypes?.join(",")}
            disabled={isUploading}
          />
          <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-primary font-medium">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Max {formatFileSize(maxFileSize)}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <Badge variant="destructive" className="text-xs">
          {uploadError}
        </Badge>
      )}
    </div>
  )
}
