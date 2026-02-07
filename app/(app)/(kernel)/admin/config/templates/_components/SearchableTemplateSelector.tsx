"use client";

/**
 * Searchable Template Selector
 * Enterprise-grade template search with virtual scrolling
 */

import * as React from "react";
import {
  IconSearch,
  IconLoader2,
  IconX,
  IconSettings,
  IconBuilding,
  IconApi,
  IconShieldCheck,
  IconCheck,
  IconEye
} from "@tabler/icons-react";
import { useEnterpriseTemplateSearch } from "../_hooks/useEnterpriseTemplateSearch";

import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
  ScrollArea,
  Skeleton,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";
import { cn } from "@afenda/shadcn/lib/utils";

import type { ConfigTemplate } from "@afenda/orchestra/zod";

const CATEGORY_ICONS = {
  System: IconSettings,
  Tenant: IconBuilding,
  Service: IconApi,
  Compliance: IconShieldCheck,
};

interface SearchableTemplateSelectorProps {
  onTemplateSelect: (template: ConfigTemplate) => void;
  onTemplatePreview?: (template: ConfigTemplate) => void;
  selectedTemplateId?: string;
  maxVisible?: number;
  showCategories?: boolean;
  showTypeFilters?: boolean;
  className?: string;
}

export function SearchableTemplateSelector({
  onTemplateSelect,
  onTemplatePreview,
  selectedTemplateId,
  maxVisible = 12,
  showCategories = true,
  showTypeFilters = true,
  className,
}: SearchableTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [templateType, setTemplateType] = React.useState<"all" | "system" | "custom">("all");

  const {
    templates,
    total,
    hasMore,
    isLoading,
    error,
    search,
    loadMore,
    allTemplates,
  } = useEnterpriseTemplateSearch({
    query: searchQuery,
    category: selectedCategory,
    includeSystem: templateType !== "custom",
    includeCustom: templateType !== "system",
    limit: maxVisible,
  });

  // Get available categories from all templates
  const categories = React.useMemo(() => {
    const cats = new Set(allTemplates.map(t => t.category));
    return Array.from(cats).sort();
  }, [allTemplates]);

  // Handle search with debouncing
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchQuery(value);
    search(value);
  }, [search]);

  // Handle category change
  const handleCategoryChange = React.useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  // Handle type filter change
  const handleTypeChange = React.useCallback((type: "all" | "system" | "custom") => {
    setTemplateType(type);
  }, []);

  // Clear search
  const clearSearch = React.useCallback(() => {
    setSearchQuery("");
    search("");
  }, [search]);

  // Show all results when searching
  const displayTemplates = searchQuery || selectedCategory !== "all" || templateType !== "all"
    ? templates
    : templates.slice(0, maxVisible);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search templates, settings, keywords..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {showCategories && (
            <ClientSelect value={selectedCategory} onValueChange={handleCategoryChange}>
              <ClientSelectTrigger className="w-[140px]">
                <ClientSelectValue placeholder="Category" />
              </ClientSelectTrigger>
              <ClientSelectContent>
                <ClientSelectItem value="all">All Categories</ClientSelectItem>
                {categories.map((category) => {
                  const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                  return (
                    <ClientSelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" />
                        {category}
                      </div>
                    </ClientSelectItem>
                  );
                })}
              </ClientSelectContent>
            </ClientSelect>
          )}

          {showTypeFilters && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={templateType === "all" ? "default" : "outline"}
                onClick={() => handleTypeChange("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={templateType === "system" ? "default" : "outline"}
                onClick={() => handleTypeChange("system")}
              >
                System
              </Button>
              <Button
                size="sm"
                variant={templateType === "custom" ? "default" : "outline"}
                onClick={() => handleTypeChange("custom")}
              >
                Custom
              </Button>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center text-sm text-muted-foreground ml-auto">
            {isLoading ? (
              <IconLoader2 className="size-4 animate-spin mr-1" />
            ) : (
              <span>{total} template{total !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <ScrollArea className="h-[400px]">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && templates.length === 0 ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="opacity-50">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : displayTemplates.length === 0 ? (
            // Empty state
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all" || templateType !== "all"
                  ? "No templates found matching your criteria."
                  : "No templates available."}
              </p>
            </div>
          ) : (
            // Template cards
            displayTemplates.map((template) => {
              const Icon = CATEGORY_ICONS[template.category as keyof typeof CATEGORY_ICONS];
              const isSelected = selectedTemplateId === template.id;
              const isCustom = template.id.startsWith("custom-");

              return (
                <Card
                  key={template.id}
                  className={cn(
                    "group transition-all hover:shadow-md cursor-pointer",
                    isSelected && "ring-2 ring-primary"
                  )}
                  onClick={() => onTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className="mt-0.5 p-2 rounded-md bg-muted">
                          <Icon className="size-4" />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <CardTitle className="text-base leading-tight truncate">
                            {template.name}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            {isCustom ? (
                              <Badge variant="secondary" className="text-xs">
                                Custom
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                System
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <IconCheck className="size-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="text-sm line-clamp-2">
                      {template.description}
                    </CardDescription>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {template.configs.length} settings
                      </div>

                      <div className="flex gap-1">
                        {onTemplatePreview && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTemplatePreview(template);
                            }}
                          >
                            <IconEye className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {hasMore && !searchQuery && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More Templates"
              )}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
