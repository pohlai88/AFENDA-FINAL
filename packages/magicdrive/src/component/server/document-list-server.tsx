/**
 * @layer domain (magicdrive)
 * @responsibility Server component for fetching documents.
 */

import type { Document } from "../../zod/magicdrive.document.zod"

export interface DocumentListServerProps {
  workspaceId: string
  folderId?: string | null
  limit?: number
  offset?: number
  sortBy?: "name" | "createdAt" | "updatedAt" | "size"
  sortOrder?: "asc" | "desc"
}

/**
 * Server component that fetches documents.
 * Use with React Suspense for streaming.
 */
export async function getDocumentListServer({
  workspaceId: _workspaceId,
  folderId: _folderId = null,
  limit: _limit = 50,
  offset: _offset = 0,
  sortBy: _sortBy = "createdAt",
  sortOrder: _sortOrder = "desc",
}: DocumentListServerProps) {
  // TODO: Fetch documents from database
  const documents: Document[] = []
  const total = 0
  const hasMore = false

  return { documents, total, hasMore }
}

export interface DocumentPreviewServerProps {
  documentId: string
  workspaceId: string
}

/**
 * Server component that fetches document details for preview.
 */
export async function getDocumentPreviewServer({
  documentId: _documentId,
  workspaceId: _workspaceId,
}: DocumentPreviewServerProps) {
  // TODO: Fetch document details from database
  return null
}
