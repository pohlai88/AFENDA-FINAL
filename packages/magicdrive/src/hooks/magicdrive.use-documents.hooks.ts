/**
 * @layer domain (magicdrive)
 * @responsibility Hook to fetch MagicDrive objects (documents) for DocumentHub
 */

"use client"

import { useCallback } from "react"
import { routes } from "@afenda/shared/constants"
import { useDocumentHubStore } from "../zustand"
import type { SortBy, SortOrder } from "../zustand"
import type { SmartFilter } from "../zustand"

export type UseDocumentsOptions = {
  sortBy?: SortBy
  sortOrder?: SortOrder
  limit?: number
  offset?: number
}

export type UseDocumentsResult = {
  fetchDocuments: () => Promise<void>
}

export function useDocuments(
  filters: SmartFilter,
  options: UseDocumentsOptions = {}
): UseDocumentsResult {
  const { sortBy = "updatedAt", sortOrder = "desc", limit = 50, offset = 0 } = options
  const setDocuments = useDocumentHubStore((s) => s.setDocuments)
  const setLoading = useDocumentHubStore((s) => s.setLoading)
  const setError = useDocumentHubStore((s) => s.setError)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set("limit", String(limit))
      params.set("offset", String(offset))
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)
      if (filters.status) params.set("status", filters.status)
      if (filters.type) params.set("docType", filters.type)
      if (filters.searchQuery) params.set("q", filters.searchQuery)
      if (filters.tags?.length) params.set("tagId", filters.tags[0])
      if (filters.hasTags !== undefined) params.set("hasTags", String(filters.hasTags))
      if (filters.hasType !== undefined) params.set("hasType", String(filters.hasType))

      const url = `${routes.api.v1.magicdrive.list()}?${params.toString()}`
      const res = await fetch(url, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch documents")
      const data = await res.json()
      const items = data.data?.items ?? []
      const total = data.data?.total ?? 0
      setDocuments(items, total)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents")
      setDocuments([], 0)
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder, limit, offset, setDocuments, setLoading, setError])

  return { fetchDocuments }
}
