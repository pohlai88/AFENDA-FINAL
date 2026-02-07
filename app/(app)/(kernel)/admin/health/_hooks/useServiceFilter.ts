"use client";

/**
 * Service Filter Hook
 * Manages service filtering state with localStorage persistence.
 * 
 * @domain kernel
 * @layer hook
 */

import { useState, useEffect, useMemo } from "react";

export interface ServiceFilterState {
  status: ("healthy" | "degraded" | "down")[];
  searchQuery: string;
  tags: string[];
}

interface Service {
  serviceId: string;
  status: "healthy" | "degraded" | "down";
  tags?: string[];
}

const FILTER_STORAGE_KEY = "orchestra-health-filters";

const defaultFilters: ServiceFilterState = {
  status: [],
  searchQuery: "",
  tags: [],
};

export function useServiceFilter<T extends Service>(services: T[]) {
  // Load filters from localStorage on mount using lazy initialization
  const [filters, setFilters] = useState<ServiceFilterState>(() => {
    try {
      const stored = localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load service filters from localStorage:", error);
    }
    return defaultFilters;
  });

  // Save filters to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.warn("Failed to save service filters to localStorage:", error);
    }
  }, [filters]);

  // Extract available tags from services
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    services.forEach((service) => {
      service.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [services]);

  // Filter services based on current filters
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Filter by status
      if (filters.status.length > 0 && !filters.status.includes(service.status)) {
        return false;
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesId = service.serviceId.toLowerCase().includes(query);
        return matchesId;
      }

      // Filter by tags
      if (filters.tags.length > 0) {
        if (!service.tags || service.tags.length === 0) {
          return false;
        }
        const hasMatchingTag = filters.tags.some((tag) =>
          service.tags?.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }, [services, filters]);

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.searchQuery.length > 0 ||
    filters.tags.length > 0;

  return {
    filters,
    setFilters,
    filteredServices,
    availableTags,
    clearFilters,
    hasActiveFilters,
    totalCount: services.length,
    filteredCount: filteredServices.length,
  };
}
