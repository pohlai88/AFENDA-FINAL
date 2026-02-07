/**
 * @layer domain (magicdrive)
 * @responsibility Hook for document search with debouncing.
 */

"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { Document } from "../zod/magicdrive.document.zod"

export interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
}

/**
 * Hook for searching documents with debouncing.
 */
export function useDocumentSearch(
  documents: Document[],
  options: UseSearchOptions = {}
) {
  const { debounceMs = 300, minQueryLength = 2 } = options

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Debounce query updates
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, debounceMs])

  const filteredDocuments = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < minQueryLength) {
      return documents
    }

    const lowerQuery = debouncedQuery.toLowerCase()
    return documents.filter((doc) => {
      // Search in name
      if (doc.name.toLowerCase().includes(lowerQuery)) return true
      // Search in description
      if (doc.description?.toLowerCase().includes(lowerQuery)) return true
      // Search in type
      if (doc.type.toLowerCase().includes(lowerQuery)) return true
      return false
    })
  }, [documents, debouncedQuery, minQueryLength])

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  const clearQuery = useCallback(() => {
    setQuery("")
    setDebouncedQuery("")
  }, [])

  const isSearching = query !== debouncedQuery
  const hasResults = filteredDocuments.length > 0
  const resultCount = filteredDocuments.length

  return {
    query,
    debouncedQuery,
    filteredDocuments,
    handleQueryChange,
    clearQuery,
    isSearching,
    hasResults,
    resultCount,
    isFiltered: debouncedQuery.length >= minQueryLength,
  }
}
