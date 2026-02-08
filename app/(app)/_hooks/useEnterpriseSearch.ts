"use client";

/**
 * Enterprise-Grade Search Hook
 * Advanced search with debouncing, caching, and relevance scoring
 * 
 * Features:
 * - Debounced search (300ms default)
 * - Result caching with TTL
 * - Multi-field search with weighting
 * - Relevance scoring and sorting
 * - Advanced filtering options
 * - Performance optimization
 */

import * as React from "react";

export interface SearchFieldConfig {
  field: string;
  weight: number; // 0.0 - 1.0, higher = more important
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- transform receives heterogeneous field values; callers need specific types
  transform?: (value: any) => string;
}

export interface SearchOptions<T = unknown> {
  query?: string;
  fields?: SearchFieldConfig[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- filter values are heterogeneous primitives
  filters?: Record<string, any>;
  debounceMs?: number;
  cacheTTL?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'field' | 'custom';
  customSort?: (a: T, b: T, query: string) => number;
}

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  query: string;
  searchTime: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- constraint requires indexable record with arbitrary values
export function useEnterpriseSearch<T extends Record<string, any>>(
  data: T[],
  options: SearchOptions<T> = {}
) {
  const [searchResult, setSearchResult] = React.useState<SearchResult<T>>({
    items: [],
    total: 0,
    hasMore: false,
    isLoading: false,
    error: null,
    query: "",
    searchTime: 0,
  });

  const [searchOptions, setSearchOptions] = React.useState<SearchOptions<T>>({
    debounceMs: 300,
    cacheTTL: 5000, // 5 seconds
    fields: [],
    filters: {},
    limit: 50,
    offset: 0,
    sortBy: 'relevance',
    ...options,
  });

  // Refs for performance
  const cacheRef = React.useRef<Map<string, { items: T[]; timestamp: number }>>(new Map());
  const searchStartTimeRef = React.useRef<number>(0);
  const debouncedQueryRef = React.useRef<string>("");

  // Debounced query state
  const [debouncedQuery, setDebouncedQuery] = React.useState(searchOptions.query || "");

  // Debounce effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchOptions.query || "");
    }, searchOptions.debounceMs);

    return () => clearTimeout(timer);
  }, [searchOptions.query, searchOptions.debounceMs]);

  // Clear expired cache entries
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cache = cacheRef.current;
      
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > (searchOptions.cacheTTL || 5000)) {
          cache.delete(key);
        }
      }
    }, 1000); // Clean every second

    return () => clearInterval(interval);
  }, [searchOptions.cacheTTL]);

  // Calculate relevance score for an item
  const calculateRelevanceScore = React.useCallback((item: T, query: string): number => {
    if (!query.trim()) return 0;

    const queryLower = query.toLowerCase();
    let totalScore = 0;
    let fieldCount = 0;

    for (const fieldConfig of searchOptions.fields || []) {
      const fieldValue = item[fieldConfig.field];
      if (fieldValue == null) continue;

      const stringValue = fieldConfig.transform 
        ? fieldConfig.transform(fieldValue).toLowerCase()
        : String(fieldValue).toLowerCase();

      if (stringValue === queryLower) {
        totalScore += fieldConfig.weight * 100; // Exact match
      } else if (stringValue.startsWith(queryLower)) {
        totalScore += fieldConfig.weight * 80; // Starts with
      } else if (stringValue.includes(queryLower)) {
        totalScore += fieldConfig.weight * 60; // Contains
      } else {
        // Fuzzy matching for partial words
        const queryWords = queryLower.split(' ');
        const fieldWords = stringValue.split(' ');
        
        for (const queryWord of queryWords) {
          for (const fieldWord of fieldWords) {
            if (fieldWord.includes(queryWord)) {
              totalScore += fieldConfig.weight * 30;
              break;
            }
          }
        }
      }

      fieldCount++;
    }

    return fieldCount > 0 ? totalScore / fieldCount : 0;
  }, [searchOptions.fields]);

  // Apply filters to items
  const applyFilters = React.useCallback((items: T[]): T[] => {
    if (!searchOptions.filters || Object.keys(searchOptions.filters).length === 0) {
      return items;
    }

    return items.filter(item => {
      for (const [filterKey, filterValue] of Object.entries(searchOptions.filters!)) {
        if (filterValue === null || filterValue === undefined) continue;
        if (filterValue === "all") continue;
        
        const itemValue = item[filterKey];
        if (Array.isArray(filterValue)) {
          if (!filterValue.includes(itemValue)) return false;
        } else {
          if (itemValue !== filterValue) return false;
        }
      }
      return true;
    });
  }, [searchOptions.filters]);

  // Main search effect
  React.useEffect(() => {
    if (data.length === 0) {
      setSearchResult(prev => ({
        ...prev,
        items: [],
        total: 0,
        isLoading: false,
        error: null,
      }));
      return;
    }

    searchStartTimeRef.current = Date.now();
    setSearchResult(prev => ({ ...prev, isLoading: true, error: null }));

    // Check cache first
    const cacheKey = JSON.stringify({
      query: debouncedQuery,
      filters: searchOptions.filters,
      fields: searchOptions.fields?.map(f => f.field),
    });

    const cache = cacheRef.current;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < (searchOptions.cacheTTL || 5000)) {
      const searchTime = Date.now() - searchStartTimeRef.current;
      const offset = searchOptions.offset || 0;
      const limit = searchOptions.limit || cached.items.length;
      
      setSearchResult({
        items: cached.items.slice(offset, offset + limit),
        total: cached.items.length,
        hasMore: offset + limit < cached.items.length,
        isLoading: false,
        error: null,
        query: debouncedQuery,
        searchTime,
      });
      return;
    }

    try {
      // Apply filters first
      let filteredItems = applyFilters(data);

      // Apply search query
      if (debouncedQuery.trim() && searchOptions.fields && searchOptions.fields.length > 0) {
        filteredItems = filteredItems
          .map(item => ({
            item,
            score: calculateRelevanceScore(item, debouncedQuery),
          }))
          .filter(result => result.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(result => result.item);
      }

      // Apply custom sorting if provided
      if (searchOptions.sortBy === 'custom' && searchOptions.customSort) {
        filteredItems.sort((a, b) => searchOptions.customSort!(a, b, debouncedQuery));
      }

      // Cache results
      cache.set(cacheKey, {
        items: filteredItems,
        timestamp: Date.now(),
      });

      // Apply pagination
      const offset = searchOptions.offset || 0;
      const limit = searchOptions.limit || filteredItems.length;
      const paginatedItems = filteredItems.slice(offset, offset + limit);

      const searchTime = Date.now() - searchStartTimeRef.current;

      setSearchResult({
        items: paginatedItems,
        total: filteredItems.length,
        hasMore: offset + limit < filteredItems.length,
        isLoading: false,
        error: null,
        query: debouncedQuery,
        searchTime,
      });
    } catch (error) {
      setSearchResult(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Search failed",
      }));
    }
  }, [
    data,
    debouncedQuery,
    searchOptions.fields,
    searchOptions.filters,
    searchOptions.offset,
    searchOptions.limit,
    searchOptions.sortBy,
    searchOptions.customSort,
    applyFilters,
    calculateRelevanceScore,
    searchOptions.cacheTTL,
  ]);

  // Update search options
  const updateSearch = React.useCallback((newOptions: Partial<SearchOptions<T>>) => {
    setSearchOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Search function
  const search = React.useCallback((query: string) => {
    updateSearch({ query, offset: 0 });
  }, [updateSearch]);

  // Load more function
  const loadMore = React.useCallback(() => {
    if (searchResult.hasMore && !searchResult.isLoading) {
      const currentOffset = searchOptions.offset || 0;
      const currentLimit = searchOptions.limit || 50;
      updateSearch({ offset: currentOffset + currentLimit });
    }
  }, [searchResult.hasMore, searchResult.isLoading, searchOptions, updateSearch]);

  // Reset function
  const reset = React.useCallback(() => {
    setSearchOptions(prev => ({ ...prev, query: "", offset: 0 }));
  }, []);

  // Clear cache function
  const clearCache = React.useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    ...searchResult,
    search,
    updateSearch,
    loadMore,
    reset,
    clearCache,
    searchOptions,
  };
}

// Utility functions for common search field configurations
export const createSearchFields = {
  // For audit entries
  audit: (): SearchFieldConfig[] => [
    { field: 'eventType', weight: 0.8 },
    { field: 'entityType', weight: 0.6 },
    { field: 'entityId', weight: 0.5 },
    { field: 'actorId', weight: 0.4 },
    { field: 'traceId', weight: 0.3 },
    { 
      field: 'metadata', 
      weight: 0.2,
      transform: (value: unknown) => JSON.stringify(value),
    },
  ],

  // For services
  services: (): SearchFieldConfig[] => [
    { field: 'id', weight: 0.9 },
    { field: 'endpoint', weight: 0.8 },
    { field: 'description', weight: 0.7 },
    { field: 'version', weight: 0.5 },
    { 
      field: 'tags', 
      weight: 0.6,
      transform: (tags: string[]) => tags.join(' '),
    },
  ],

  // For templates
  templates: (): SearchFieldConfig[] => [
    { field: 'name', weight: 0.9 },
    { field: 'description', weight: 0.8 },
    { field: 'category', weight: 0.6 },
    { 
      field: 'configs', 
      weight: 0.4,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- config objects have dynamic shape from templates
      transform: (configs: any[]) => 
        configs.map(c => `${c.key} ${c.description}`).join(' '),
    },
  ],

  // For backups
  backups: (): SearchFieldConfig[] => [
    { field: 'filename', weight: 0.9 },
    { field: 'type', weight: 0.7 },
    { field: 'createdBy', weight: 0.5 },
    { 
      field: 'metadata', 
      weight: 0.3,
      transform: (value: unknown) => JSON.stringify(value),
    },
  ],
};
