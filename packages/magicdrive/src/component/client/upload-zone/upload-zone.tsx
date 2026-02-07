/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Modern upload experience with drag-and-drop, progress tracking, and mobile support
 * Features: Full-screen drop zone, file validation, progress bars, smart suggestions
 */

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import { routes } from "@afenda/shared/constants"
import { cn } from "@afenda/shared/utils"
import { Button } from "@afenda/shadcn"
import { Card, CardContent } from "@afenda/shadcn"
import { Progress } from "@afenda/shadcn"
import { Alert, AlertDescription, AlertTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { useUploadStore } from "@afenda/magicdrive/zustand"
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Play,
} from "lucide-react"
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES } from "@afenda/shared/constants/magicdrive"

interface UploadZoneProps {
  className?: string
  compact?: boolean
}

export function UploadZone({ className, compact = false }: UploadZoneProps) {
  const {
    queue,
    activeUploads,
    completedUploads,
    failedUploads,
    isDragOver,
    addToQueue,
    removeFromQueue,
    startUpload,
    completeUpload,
    setDragOver,
    clearCompleted,
  } = useUploadStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(routes.api.v1.magicdrive.health(), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStorageConfigured(d.data?.storageConfigured ?? false))
      .catch(() => setStorageConfigured(false))
  }, [])

  // File validation
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_BYTES) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${MAX_FILE_BYTES / (1024 * 1024)}MB`
      }
    }

    // Check MIME type
    const allowedMimeTypes: readonly string[] = ALLOWED_MIME_TYPES
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload PDF, JPEG, PNG, WebP, or TIFF files.'
      }
    }

    return { valid: true }
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(files).forEach((file) => {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (validFiles.length > 0) {
      addToQueue(validFiles)
    }

    if (errors.length > 0) {
      console.error('Upload errors:', errors)
      // TODO: Show error notification
    }
  }, [validateFile, addToQueue])

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [setDragOver])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [setDragOver])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect, setDragOver])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    if (e.target.files) {
      e.target.value = '' // Reset input
    }
  }, [handleFileSelect])

  // Upload a single file using proxy upload → ingest flow with progress tracking
  const uploadFile = useCallback(async (uploadId: string, file: File) => {
    const { failUpload, updateProgress } = useUploadStore.getState()
    startUpload(uploadId)

    try {
      // Step 1: Upload file via proxy endpoint with XHR for progress (0-80%)
      updateProgress(uploadId, 5, 'uploading')

      const uploadResult = await new Promise<{ uploadId: string; objectId: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', routes.api.v1.magicdrive.upload(), true)
        xhr.withCredentials = true

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const uploadPercent = Math.round((event.loaded / event.total) * 75) + 5
            updateProgress(uploadId, Math.min(uploadPercent, 80), 'uploading')
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              if (response.data) {
                resolve(response.data)
              } else {
                reject(new Error(response.error?.message || 'Upload failed'))
              }
            } catch {
              reject(new Error('Invalid server response'))
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              const msg = errorResponse.error?.message || (xhr.status === 503 ? 'Storage not configured' : 'Upload failed')
              reject(new Error(msg))
            } catch {
              reject(new Error(xhr.status === 503 ? 'Storage not configured' : 'Upload failed'))
            }
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))

        const formData = new FormData()
        formData.append('file', file)
        xhr.send(formData)
      })

      updateProgress(uploadId, 85, 'processing')

      // Step 2: Call ingest to finalize (85-95%)
      const ingestRes = await fetch(routes.api.v1.magicdrive.ingest(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uploadId: uploadResult.uploadId }),
      })

      if (!ingestRes.ok) {
        const err = await ingestRes.json()
        throw new Error(err.error?.message || 'Failed to process upload')
      }

      const ingestData = await ingestRes.json()
      updateProgress(uploadId, 95, 'processing')

      // Step 3: Complete upload in store
      completeUpload(uploadId, {
        documentId: uploadResult.objectId,
        url: routes.ui.magicdrive.documentById(uploadResult.objectId),
      })

      toast.success(`Document uploaded successfully`)
      return ingestData.data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      failUpload(uploadId, message)
      toast.error(message)
      throw error
    }
  }, [startUpload, completeUpload])

  // Start processing uploads
  const startProcessing = useCallback(async () => {
    setIsProcessing(true)

    const pendingUploads = queue.filter(item => item.status === 'pending')

    // Process uploads sequentially to avoid overwhelming the server
    for (const upload of pendingUploads) {
      try {
        await uploadFile(upload.id, upload.file)
      } catch {
        // Error already handled in uploadFile via failUpload
      }
    }

    setIsProcessing(false)
  }, [queue, uploadFile])

  // Get file icon
  const getFileIcon = useCallback((mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType === 'application/pdf') return FileText
    return File
  }, [])

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }, [])

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_MIME_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>
        {queue.length > 0 && (
          <Badge variant="secondary">
            {queue.length} files
          </Badge>
        )}
      </div>
    )
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {storageConfigured === false && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Storage not configured</AlertTitle>
          <AlertDescription>
            Uploads are unavailable. Please contact your administrator to configure storage (R2).
          </AlertDescription>
        </Alert>
      )}

      {/* Main upload zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-200",
          isDragOver && "border-primary bg-primary/5",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className={cn(
              "p-4 rounded-full transition-colors",
              isDragOver ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Upload className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isDragOver ? 'Drop files here' : 'Upload documents'}
              </h3>
              <p className="text-muted-foreground">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, JPEG, PNG, WebP, and TIFF files up to {MAX_FILE_BYTES / (1024 * 1024)}MB
              </p>
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload queue */}
      {queue.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Upload Queue ({queue.length})</h4>
              <div className="flex items-center gap-2">
                {completedUploads.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCompleted}
                    className="gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Completed
                  </Button>
                )}
                {!isProcessing && queue.some(item => item.status === 'pending') && (
                  <Button
                    onClick={startProcessing}
                    size="sm"
                    className="gap-1"
                  >
                    <Play className="h-4 w-4" />
                    Start Upload
                  </Button>
                )}
                {isProcessing && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="gap-1"
                  >
                    <Clock className="h-4 w-4 animate-spin" />
                    Processing...
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {queue.map((item) => {
                const FileIcon = getFileIcon(item.file.type)
                const isActive = activeUploads.has(item.id)
                const isCompleted = completedUploads.has(item.id)
                const hasFailed = failedUploads.has(item.id)

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      isActive && "border-primary bg-primary/5",
                      isCompleted && "border-emerald-500/30 bg-emerald-500/10 dark:border-emerald-400/30 dark:bg-emerald-400/10",
                      hasFailed && "border-destructive/30 bg-destructive/10"
                    )}
                  >
                    <FileIcon className="h-5 w-5 text-muted-foreground" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {item.file.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {isCompleted && <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                          {hasFailed && <AlertCircle className="h-4 w-4 text-destructive" />}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromQueue(item.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(item.file.size)}</span>
                        <span>{item.status}</span>
                      </div>

                      {(isActive || isCompleted) && (
                        <Progress
                          value={item.progress}
                          className="mt-2 h-1"
                        />
                      )}

                      {hasFailed && item.error && (
                        <p className="text-xs text-destructive mt-1">{item.error}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
