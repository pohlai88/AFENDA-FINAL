"use client";

/**
 * Template Search Component
 * Search templates by name, description, category, scope, and config keys.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Input, ClientSelect, ClientSelectContent, ClientSelectItem, ClientSelectTrigger, ClientSelectValue, Button } from "@afenda/shadcn";

interface TemplateSearchProps {
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onScopeChange: (scope: string) => void;
  categories: string[];
  activeCategory: string;
  activeScope: string;
  resultCount: number;
  totalCount: number;
}

export function TemplateSearch({
  onSearchChange,
  onCategoryChange,
  onScopeChange,
  categories,
  activeCategory,
  activeScope,
  resultCount,
  totalCount,
}: TemplateSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    onSearchChange("");
    onCategoryChange("all");
    onScopeChange("all");
  };

  const hasActiveFilters = searchQuery || activeCategory !== "all" || activeScope !== "all";

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search templates by name, description, or config keys..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1"
        />
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <ClientSelect value={activeCategory} onValueChange={onCategoryChange}>
            <ClientSelectTrigger>
              <ClientSelectValue placeholder="All Categories" />
            </ClientSelectTrigger>
            <ClientSelectContent>
              <ClientSelectItem value="all">All Categories</ClientSelectItem>
              {categories.map((category) => (
                <ClientSelectItem key={category} value={category}>
                  {category}
                </ClientSelectItem>
              ))}
            </ClientSelectContent>
          </ClientSelect>
        </div>

        <div className="flex-1">
          <ClientSelect value={activeScope} onValueChange={onScopeChange}>
            <ClientSelectTrigger>
              <ClientSelectValue placeholder="All Scopes" />
            </ClientSelectTrigger>
            <ClientSelectContent>
              <ClientSelectItem value="all">All Scopes</ClientSelectItem>
              <ClientSelectItem value="global">Global</ClientSelectItem>
              <ClientSelectItem value="tenant">Tenant</ClientSelectItem>
              <ClientSelectItem value="service">Service</ClientSelectItem>
            </ClientSelectContent>
          </ClientSelect>
        </div>
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Showing {resultCount} of {totalCount} templates
        </div>
      )}
    </div>
  );
}
