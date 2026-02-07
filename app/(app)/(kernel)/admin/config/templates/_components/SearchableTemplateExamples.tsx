"use client";

/**
 * Searchable Template Examples
 * Enterprise-grade template examples with search for Create Template
 */

import * as React from "react";
import { 
  IconSearch, 
  IconLoader2, 
  IconX,
  IconCopy,
  IconSettings,
  IconBuilding,
  IconApi,
  IconShieldCheck,
  IconEye,
  IconSparkles
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@afenda/shadcn";
import { cn } from "@afenda/shadcn/lib/utils";

import type { ConfigTemplate } from "@afenda/orchestra/zod";

const CATEGORY_ICONS = {
  System: IconSettings,
  Tenant: IconBuilding,
  Service: IconApi,
  Compliance: IconShieldCheck,
};

interface SearchableTemplateExamplesProps {
  onExampleSelect: (template: ConfigTemplate) => void;
  onExamplePreview?: (template: ConfigTemplate) => void;
  maxVisible?: number;
  showCategories?: boolean;
  className?: string;
}

export function SearchableTemplateExamples({
  onExampleSelect,
  onExamplePreview,
  maxVisible = 12,
  showCategories = true,
  className,
}: SearchableTemplateExamplesProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [activeTab, setActiveTab] = React.useState("all");
  
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
    limit: maxVisible,
  });

  // Get available categories from all templates
  const categories = React.useMemo(() => {
    const cats = new Set(allTemplates.map(t => t.category));
    return Array.from(cats).sort();
  }, [allTemplates]);

  // Filter templates by tab
  const filteredTemplates = React.useMemo(() => {
    if (activeTab === "all") return templates;
    if (activeTab === "system") return templates.filter(t => !t.id.startsWith("custom-"));
    if (activeTab === "custom") return templates.filter(t => t.id.startsWith("custom-"));
    return templates;
  }, [templates, activeTab]);

  // Handle search with debouncing
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchQuery(value);
    search(value);
  }, [search]);

  // Handle category change
  const handleCategoryChange = React.useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  // Clear search
  const clearSearch = React.useCallback(() => {
    setSearchQuery("");
    search("");
  }, [search]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <IconSparkles className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">Template Examples</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Browse existing templates to get inspiration or use as a starting point
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search template examples..."
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

      {/* Category Filter */}
      {showCategories && (
        <ClientSelect value={selectedCategory} onValueChange={handleCategoryChange}>
          <ClientSelectTrigger className="w-[200px]">
            <ClientSelectValue placeholder="Filter by category" />
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

      {/* Tabs for System/Custom */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All
            <Badge variant="secondary" className="text-xs">
              {allTemplates.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            System
            <Badge variant="outline" className="text-xs">
              {allTemplates.filter(t => !t.id.startsWith("custom-")).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            Custom
            <Badge variant="outline" className="text-xs">
              {allTemplates.filter(t => t.id.startsWith("custom-")).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="grid gap-3 md:grid-cols-2">
              {isLoading && filteredTemplates.length === 0 ? (
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
              ) : filteredTemplates.length === 0 ? (
                // Empty state
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery || selectedCategory !== "all"
                      ? "No template examples found matching your criteria."
                      : "No template examples available."}
                  </p>
                </div>
              ) : (
                // Template cards
                filteredTemplates.map((template) => {
                  const Icon = CATEGORY_ICONS[template.category as keyof typeof CATEGORY_ICONS];
                  const isCustom = template.id.startsWith("custom-");
                  
                  return (
                    <Card
                      key={template.id}
                      className="group transition-all hover:shadow-md cursor-pointer"
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
                            {onExamplePreview && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExamplePreview(template);
                                }}
                              >
                                <IconEye className="size-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onExampleSelect(template);
                              }}
                            >
                              <IconCopy className="size-4" />
                            </Button>
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
                    "Load More Examples"
                  )}
                </Button>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredTemplates.length} of {total} template{total !== 1 ? "s" : ""}
        </span>
        {isLoading && (
          <div className="flex items-center gap-1">
            <IconLoader2 className="size-4 animate-spin" />
            <span>Searching...</span>
          </div>
        )}
      </div>
    </div>
  );
}
