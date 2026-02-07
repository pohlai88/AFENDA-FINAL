"use client";

/**
 * Template Search Hook
 * Filters templates by search query, category, and scope.
 * 
 * @domain kernel
 * @layer hook
 */

import { useState, useMemo } from "react";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  scope?: string;
  configs: Array<{
    key: string;
    value?: unknown;
    description?: string;
    required?: boolean;
    validation?: unknown;
  }>;
}

export function useTemplateSearch(templates: Template[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeScope, setActiveScope] = useState("all");

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Category filter
      if (activeCategory !== "all" && template.category !== activeCategory) {
        return false;
      }

      // Scope filter
      if (activeScope !== "all" && template.scope && template.scope !== activeScope) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();

        // Search in name
        if (template.name.toLowerCase().includes(query)) {
          return true;
        }

        // Search in description
        if (template.description.toLowerCase().includes(query)) {
          return true;
        }

        // Search in config keys
        const hasMatchingKey = template.configs.some((config) =>
          config.key.toLowerCase().includes(query)
        );
        if (hasMatchingKey) {
          return true;
        }

        return false;
      }

      return true;
    });
  }, [templates, searchQuery, activeCategory, activeScope]);

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    activeScope,
    setActiveScope,
    filteredTemplates,
    totalCount: templates.length,
    filteredCount: filteredTemplates.length,
  };
}
