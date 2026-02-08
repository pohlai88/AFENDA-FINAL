/**
 * @layer domain (magicdrive)
 * @responsibility Upload dropzone component.
 */

"use client"

import * as React from "react"
import { Upload, X } from "lucide-react"
import { cn } from "@afenda/shared/utils"
import { useUpload, type UploadFile } from "../../hooks/magicdrive.use-upload.hooks"

export interface UploadDropzoneProps {
  workspaceId: string
  folderId: string | null
  onUploadComplete?: (files: File[]) => void
  className?: string
  children?: React.ReactNode
}

export function UploadDropzone({
  workspaceId: _workspaceId,
  folderId: _folderId,
  onUploadComplete,
  className,
  children,
}: UploadDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const {
    isDragging,
    uploads,
    dropzoneProps,
    handleFileSelect,
    removeUpload,
    clearUploads,
  } = useUpload({
    onUpload: async (files) => {
      // TODO: Implement actual upload via server action
      onUploadComplete?.(files)
    },
  })

  const pendingUploads = uploads.filter((u) => u.status === "pending" || u.status === "uploading")
  const hasUploads = pendingUploads.length > 0

  return (
    <div className={cn("relative", className)}>
      {/* Main content with dropzone handlers */}
      <div {...dropzoneProps} className="relative">
        {children}

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="h-12 w-12" />
              <span className="font-medium">Drop files to upload</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload progress panel */}
      {hasUploads && (
        <div className="fixed bottom-4 right-4 w-80 bg-background border rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm">
              Uploading {pendingUploads.length} file(s)
            </span>
            <button
              onClick={clearUploads}
              className="p-1 hover:bg-accent rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingUploads.map((upload) => (
              <UploadProgressItem
                key={upload.id}
                upload={upload}
                onRemove={() => removeUpload(upload.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface UploadProgressItemProps {
  upload: UploadFile
  onRemove: () => void
}

function UploadProgressItem({ upload, onRemove }: UploadProgressItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{upload.file.name}</p>
        <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
          <div
            className={cn(
              "h-full transition-all",
              upload.status === "error" ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${upload.progress}%` }}
          />
        </div>
      </div>
      <button onClick={onRemove} className="p-1 hover:bg-accent rounded">
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

/**
 * Compact upload button.
 */
export function UploadButton({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors",
        className
      )}
    >
      <Upload className="h-4 w-4" />
      <span>Upload</span>
    </button>
  )
}
