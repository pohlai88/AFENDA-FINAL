"use client";

/**
 * Enterprise-Grade Template Search Hook
 * Advanced search with debouncing, caching, and filtering
 */

import * as React from "react";
import { routes } from "@afenda/shared/constants";
import type { ConfigTemplate, TemplateListResponse } from "@afenda/orchestra/zod";

interface SearchOptions {
  query?: string;
  category?: string;
  includeSystem?: boolean;
  includeCustom?: boolean;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  templates: ConfigTemplate[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useEnterpriseTemplateSearch(initialOptions: SearchOptions = {}) {
  const [searchResult, setSearchResult] = React.useState<SearchResult>({
    templates: [],
    total: 0,
    hasMore: false,
    isLoading: false,
    error: null,
  });

  const [allTemplates, setAllTemplates] = React.useState<ConfigTemplate[]>([]);
  const [searchOptions, setSearchOptions] = React.useState<SearchOptions>(initialOptions);
  const [debouncedQuery, setDebouncedQuery] = React.useState(searchOptions.query || "");

  // Use ref for cache to avoid dependency issues
  const cacheRef = React.useRef<Map<string, TemplateListResponse>>(new Map());

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchOptions.query || "");
    }, 300);

    return () => clearTimeout(timer);
  }, [searchOptions.query]);

  // Fetch all templates once for comprehensive search
  React.useEffect(() => {
    async function fetchAllTemplates() {
      try {
        setSearchResult(prev => ({ ...prev, isLoading: true, error: null }));

        const cacheKey = "all-templates";
        const cache = cacheRef.current;

        if (cache.has(cacheKey)) {
          const cached = cache.get(cacheKey)!;
          setAllTemplates(cached.templates);
          setSearchResult(prev => ({
            ...prev,
            templates: cached.templates,
            total: cached.templates.length,
            isLoading: false,
          }));
          return;
        }

        const response = await fetch(routes.api.orchestra.configTemplatesBff());
        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error?.message || "Failed to fetch templates");
        }

        setAllTemplates(result.data.templates);
        cache.set(cacheKey, result.data);

        setSearchResult(prev => ({
          ...prev,
          templates: result.data.templates,
          total: result.data.templates.length,
          isLoading: false,
        }));
      } catch (err) {
        setSearchResult(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : "Failed to fetch templates",
          isLoading: false,
        }));
      }
    }

    fetchAllTemplates();
  }, []); // Empty deps - only fetch once on mount

  // Filter templates based on search options
  React.useEffect(() => {
    if (allTemplates.length === 0) return;

    let filtered = [...allTemplates];

    // Filter by search query
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.configs.some(config =>
          config.key.toLowerCase().includes(query) ||
          config.description.toLowerCase().includes(query)
        )
      );
    }

    // Filter by category
    if (searchOptions.category && searchOptions.category !== "all") {
      filtered = filtered.filter(template => template.category === searchOptions.category);
    }

    // Filter by template type
    if (searchOptions.includeSystem === false) {
      filtered = filtered.filter(template => template.id.startsWith("custom-"));
    }
    if (searchOptions.includeCustom === false) {
      filtered = filtered.filter(template => !template.id.startsWith("custom-"));
    }

    // Sort by relevance (exact matches first, then partial matches)
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      filtered.sort((a, b) => {
        const aExact = a.name.toLowerCase() === query;
        const bExact = b.name.toLowerCase() === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = a.name.toLowerCase().startsWith(query);
        const bStarts = b.name.toLowerCase().startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      });
    }

    // Apply pagination
    const offset = searchOptions.offset || 0;
    const limit = searchOptions.limit || filtered.length;
    const paginatedTemplates = filtered.slice(offset, offset + limit);

    setSearchResult({
      templates: paginatedTemplates,
      total: filtered.length,
      hasMore: offset + limit < filtered.length,
      isLoading: false,
      error: null,
    });
  }, [allTemplates, debouncedQuery, searchOptions]);

  const updateSearch = React.useCallback((newOptions: Partial<SearchOptions>) => {
    setSearchOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const search = React.useCallback((query: string) => {
    updateSearch({ query, offset: 0 });
  }, [updateSearch]);

  const loadMore = React.useCallback(() => {
    if (searchResult.hasMore && !searchResult.isLoading) {
      const currentOffset = searchOptions.offset || 0;
      const currentLimit = searchOptions.limit || 12;
      updateSearch({ offset: currentOffset + currentLimit });
    }
  }, [searchResult.hasMore, searchResult.isLoading, searchOptions, updateSearch]);

  const reset = React.useCallback(() => {
    setSearchOptions(initialOptions);
    setDebouncedQuery("");
  }, [initialOptions]);

  const clearCache = React.useCallback(() => {
    cacheRef.current = new Map();
  }, []);

  return {
    ...searchResult,
    search,
    updateSearch,
    loadMore,
    reset,
    clearCache,
    searchOptions,
    allTemplates,
  };
}

// Utility functions for template categorization
export function getTemplateCategories(templates: ConfigTemplate[]): string[] {
  const categories = new Set(templates.map(t => t.category));
  return Array.from(categories).sort();
}

export function getTemplateStats(templates: ConfigTemplate[]) {
  const system = templates.filter(t => !t.id.startsWith("custom-")).length;
  const custom = templates.filter(t => t.id.startsWith("custom-")).length;
  const categories = getTemplateCategories(templates);

  return {
    total: templates.length,
    system,
    custom,
    categories: categories.length,
    categoryBreakdown: categories.reduce((acc, cat) => {
      acc[cat] = templates.filter(t => t.category === cat).length;
      return acc;
    }, {} as Record<string, number>),
  };
}
