"use client";

/**
 * Configuration Template Browser Client Component
 * Fetches templates and manages selection state.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconCheck } from "@tabler/icons-react";

import { Button, Alert, AlertDescription } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

import { ConfigTemplateBrowser } from "../../_components/ConfigTemplateBrowser";
import { ConfigTemplateForm } from "../../_components/ConfigTemplateForm";
import { TemplateSearch } from "./TemplateSearch";
import { useTemplateSearch } from "../_hooks/useTemplateSearch";

import type { TemplateListResponse } from "@afenda/orchestra/zod";

export function ConfigTemplateBrowserClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<TemplateListResponse | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);

  // Fetch templates on mount
  React.useEffect(() => {
    async function fetchTemplates() {
      try {
        setIsLoading(true);
        const response = await fetch(routes.api.orchestra.configTemplatesBff());
        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error?.message || "Failed to fetch templates");
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch templates");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  // Search and filtering
  const {
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    activeScope,
    setActiveScope,
    filteredTemplates,
    totalCount,
    filteredCount,
  } = useTemplateSearch(data?.templates || []);

  const selectedTemplate = React.useMemo(() => {
    if (!selectedTemplateId || !data) return null;
    return data.templates.find((t) => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No templates available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <TemplateSearch
        onSearchChange={setSearchQuery}
        onCategoryChange={setActiveCategory}
        onScopeChange={setActiveScope}
        categories={data.categories}
        activeCategory={activeCategory}
        activeScope={activeScope}
        resultCount={filteredCount}
        totalCount={totalCount}
      />

      {/* Template Browser */}
      <ConfigTemplateBrowser
        templates={filteredTemplates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category as "System" | "Tenant" | "Service" | "Compliance",
          icon: t.icon,
          scope: t.scope,
          configs: t.configs.map(c => ({
            key: c.key,
            description: c.description ?? '',
            required: c.required ?? false,
            validation: (c.validation || { type: 'string' as const }) as { type: 'string' },
            value: c.value
          }))
        }))}
        categories={data.categories}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
      />

      {/* Template Form */}
      {selectedTemplate && (
        <div className="border-t pt-6">
          <ConfigTemplateForm
            template={selectedTemplate}
            onCancel={() => setSelectedTemplateId(null)}
            onSuccess={() => {
              router.push(routes.ui.admin.config());
              router.refresh();
            }}
          />
        </div>
      )}

      {/* Action Buttons */}
      {selectedTemplateId && !selectedTemplate && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setSelectedTemplateId(null)}>
            Cancel
          </Button>
          <Button disabled>
            <IconCheck className="mr-2 size-4" />
            Apply Template
          </Button>
        </div>
      )}
    </div>
  );
}
