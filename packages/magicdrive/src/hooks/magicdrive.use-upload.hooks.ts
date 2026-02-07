/**
 * @layer domain (magicdrive)
 * @responsibility Hook for drag-and-drop file upload.
 */

"use client"

import { useState, useCallback, useRef, type DragEvent } from "react"
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from "../constant/magicdrive.constants"

export interface UploadFile {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export interface UseUploadOptions {
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
  onUpload?: (files: File[]) => Promise<void>
}

/**
 * Hook for managing drag-and-drop file uploads.
 */
export function useUpload(options: UseUploadOptions = {}) {
  const {
    maxFiles = 10,
    maxSize = MAX_FILE_SIZE,
    acceptedTypes = [
      ...SUPPORTED_FILE_TYPES.documents,
      ...SUPPORTED_FILE_TYPES.images,
      ...SUPPORTED_FILE_TYPES.archives,
    ],
    onUpload,
  } = options

  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadFile[]>([])
  const dragCounterRef = useRef(0)

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File "${file.name}" exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`
      }
      if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
        return `File type "${file.type}" is not supported`
      }
      return null
    },
    [maxSize, acceptedTypes]
  )

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, maxFiles)
      const validFiles: File[] = []
      const errors: string[] = []

      for (const file of fileArray) {
        const error = validateFile(file)
        if (error) {
          errors.push(error)
        } else {
          validFiles.push(file)
        }
      }

      if (errors.length > 0) {
        console.warn("File validation errors:", errors)
      }

      if (validFiles.length === 0) return

      // Create upload entries
      const newUploads: UploadFile[] = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "pending" as const,
      }))

      setUploads((prev) => [...prev, ...newUploads])

      // Trigger upload callback
      if (onUpload) {
        try {
          await onUpload(validFiles)
          setUploads((prev) =>
            prev.map((u) =>
              newUploads.some((n) => n.id === u.id)
                ? { ...u, status: "success" as const, progress: 100 }
                : u
            )
          )
        } catch (error) {
          setUploads((prev) =>
            prev.map((u) =>
              newUploads.some((n) => n.id === u.id)
                ? { ...u, status: "error" as const, error: String(error) }
                : u
            )
          )
        }
      }
    },
    [maxFiles, validateFile, onUpload]
  )

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounterRef.current = 0

      const { files } = e.dataTransfer
      if (files && files.length > 0) {
        await processFiles(files)
      }
    },
    [processFiles]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target
      if (files && files.length > 0) {
        await processFiles(files)
      }
      // Reset input
      e.target.value = ""
    },
    [processFiles]
  )

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const clearUploads = useCallback(() => {
    setUploads([])
  }, [])

  const updateUploadProgress = useCallback((id: string, progress: number) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, progress, status: "uploading" as const } : u
      )
    )
  }, [])

  return {
    isDragging,
    uploads,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    processFiles,
    removeUpload,
    clearUploads,
    updateUploadProgress,
    dropzoneProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  }
}
