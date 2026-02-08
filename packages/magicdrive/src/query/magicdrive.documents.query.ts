/**
 * @layer domain (magicdrive)
 * @responsibility TanStack Query hooks for documents.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import type { Document, CreateDocumentInput, UpdateDocumentInput } from "../zod/magicdrive.document.zod"

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  infinite: (filters: DocumentFilters) => [...documentKeys.all, "infinite", filters] as const,
}

export interface DocumentFilters {
  workspaceId: string
  folderId?: string | null
  type?: string
  status?: string
  search?: string
  tagIds?: string[]
  isStarred?: boolean
}

interface DocumentsResponse {
  documents: Document[]
  nextCursor?: string
  total: number
}

/**
 * Query hook for fetching documents with filters.
 */
export function useDocuments(filters: DocumentFilters) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: async (): Promise<Document[]> => {
      const params = new URLSearchParams()
      params.set("workspaceId", filters.workspaceId)
      if (filters.folderId) params.set("folderId", filters.folderId)
      if (filters.type) params.set("type", filters.type)
      if (filters.status) params.set("status", filters.status)
      if (filters.search) params.set("search", filters.search)
      if (filters.tagIds?.length) params.set("tagIds", filters.tagIds.join(","))
      if (filters.isStarred !== undefined) params.set("isStarred", String(filters.isStarred))

      // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
      const res = await fetch(`/api/magicdrive/documents?${params}`)
      if (!res.ok) throw new Error("Failed to fetch documents")
      return res.json()
    },
  })
}

/**
 * Infinite query hook for paginated documents.
 */
export function useInfiniteDocuments(filters: DocumentFilters) {
  return useInfiniteQuery({
    queryKey: documentKeys.infinite(filters),
    queryFn: async ({ pageParam }): Promise<DocumentsResponse> => {
      const params = new URLSearchParams()
      params.set("workspaceId", filters.workspaceId)
      if (filters.folderId) params.set("folderId", filters.folderId)
      if (pageParam) params.set("cursor", pageParam)

      // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
      const res = await fetch(`/api/magicdrive/documents?${params}`)
      if (!res.ok) throw new Error("Failed to fetch documents")
      return res.json()
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

/**
 * Query hook for fetching a single document.
 */
export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async (): Promise<Document> => {
      // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
      const res = await fetch(`/api/magicdrive/documents/${id}`)
      if (!res.ok) throw new Error("Failed to fetch document")
      return res.json()
    },
    enabled: !!id,
  })
}

/**
 * Mutation hook for creating a document.
 */
export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateDocumentInput): Promise<Document> => {
      // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
      const res = await fetch("/api/magicdrive/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error("Failed to create document")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

/**
 * Mutation hook for updating a document.
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: UpdateDocumentInput
    }): Promise<Document> => {
      // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
      const res = await fetch(`/api/magicdrive/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error("Failed to update document")
      return res.json()
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(doc.id) })
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

/**
 * Mutation hook for deleting a document.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
      const res = await fetch(`/api/magicdrive/documents/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete document")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

/**
 * Mutation hook for bulk actions on documents.
 */
export function useBulkDocumentAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ids,
      action,
      payload,
    }: {
      ids: string[]
      action: "archive" | "delete" | "move" | "tag" | "star"
      payload?: unknown
    }): Promise<void> => {
      // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
      const res = await fetch("/api/magicdrive/documents/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, payload }),
      })
      if (!res.ok) throw new Error("Bulk action failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}
