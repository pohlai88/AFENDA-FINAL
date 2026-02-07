/**
 * @layer domain (magicdrive)
 * @responsibility Hook for document preview state.
 */

"use client"

import { useState, useCallback } from "react"
import type { Document } from "../zod/magicdrive.document.zod"

export interface UsePreviewOptions {
  onClose?: () => void
}

/**
 * Hook for managing document preview state.
 */
export function useDocumentPreview(options: UsePreviewOptions = {}) {
  const { onClose } = options

  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number>(-1)
  const [documents, setDocuments] = useState<Document[]>([])

  const openPreview = useCallback((doc: Document, allDocs?: Document[], index?: number) => {
    setPreviewDocument(doc)
    if (allDocs) {
      setDocuments(allDocs)
      setPreviewIndex(index ?? allDocs.findIndex((d) => d.id === doc.id))
    }
  }, [])

  const closePreview = useCallback(() => {
    setPreviewDocument(null)
    setPreviewIndex(-1)
    onClose?.()
  }, [onClose])

  const goToNext = useCallback(() => {
    if (documents.length === 0 || previewIndex === -1) return
    const nextIndex = (previewIndex + 1) % documents.length
    setPreviewIndex(nextIndex)
    setPreviewDocument(documents[nextIndex])
  }, [documents, previewIndex])

  const goToPrevious = useCallback(() => {
    if (documents.length === 0 || previewIndex === -1) return
    const prevIndex = previewIndex === 0 ? documents.length - 1 : previewIndex - 1
    setPreviewIndex(prevIndex)
    setPreviewDocument(documents[prevIndex])
  }, [documents, previewIndex])

  const hasNext = documents.length > 1
  const hasPrevious = documents.length > 1

  return {
    previewDocument,
    previewIndex,
    isOpen: previewDocument !== null,
    openPreview,
    closePreview,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
    currentPosition: previewIndex + 1,
    totalCount: documents.length,
  }
}
