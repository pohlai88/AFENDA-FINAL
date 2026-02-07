"use client";

/**
 * Enhanced Configuration Template Browser
 * Steve Jobs-inspired: Beautiful. Intuitive. Powerful.
 * With CRUD operations and danger-zone protection.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconSearch,
  IconFilter,
  IconServer,
  IconBuilding,
  IconApi,
  IconShieldCheck,
  IconX,
  IconLoader2,
  IconAlertCircle,
  IconPlus,
  IconEdit,
  IconCopy,
} from "@tabler/icons-react";

import {
  Badge,
  Button,
  Input,
  Alert,
  AlertDescription,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogHeader,
  ClientDialogTitle,
  ExcelExportButton,
  PDFExportButton,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { useEnterpriseTemplateSearch } from "../_hooks/useEnterpriseTemplateSearch";
import { EnhancedTemplateForm } from "./EnhancedTemplateForm";
import { EnhancedTemplateEditor } from "./EnhancedTemplateEditor";
import { DangerZoneConfirm } from "../../_components/DangerZoneConfirm";
import { TemplateCard } from "./TemplateCard";

import type { ConfigTemplate } from "@afenda/orchestra/zod";

const CATEGORY_ICONS = {
  System: IconServer,
  Tenant: IconBuilding,
  Service: IconApi,
  Compliance: IconShieldCheck,
};

function getScopeVariant(category: string): "default" | "secondary" | "outline" | "destructive" {
  switch (category) {
    case "System":
      return "default";
    case "Tenant":
      return "secondary";
    case "Service":
      return "outline";
    case "Compliance":
      return "destructive";
    default:
      return "default";
  }
}

export interface ConfigTemplateBrowserEnhancedProps {
  onClose?: () => void;
}

export function ConfigTemplateBrowserEnhanced({ onClose: _onClose }: ConfigTemplateBrowserEnhancedProps = {}) {
  const router = useRouter();

  // All state hooks must be declared first
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [isMounted, setIsMounted] = React.useState(false);

  // Editor dialog state
  const [editorDialog, setEditorDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit" | "clone";
    template?: ConfigTemplate;
  }>({
    open: false,
    mode: "create",
  });

  // Apply confirmation state
  const [applyConfirm, setApplyConfirm] = React.useState<{
    open: boolean;
    template: ConfigTemplate | null;
  }>({
    open: false,
    template: null,
  });

  // Use enterprise search hook
  const {
    templates,
    isLoading,
    error,
  } = useEnterpriseTemplateSearch();

  // Mount effect - must be before early returns
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // All callbacks and memos must be before early returns
  const handleSearchChange = React.useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = React.useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  const handleApplyTemplate = React.useCallback((template: ConfigTemplate) => {
    setApplyConfirm({ open: true, template });
  }, []);

  const handleConfirmApply = React.useCallback(() => {
    if (applyConfirm.template) {
      setSelectedTemplateId(applyConfirm.template.id);
    }
  }, [applyConfirm.template]);

  // Selected and preview templates from search results
  const selectedTemplate = React.useMemo(() => {
    if (!selectedTemplateId) return null;
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, templates]);

  const previewTemplate = React.useMemo(() => {
    if (!previewTemplateId) return null;
    return templates.find((t) => t.id === previewTemplateId) || null;
  }, [previewTemplateId, templates]);

  // Check if template is custom (user-created)
  const isCustomTemplate = React.useCallback((templateId: string) => {
    return templateId.startsWith("custom-");
  }, []);

  // Handle template CRUD operations
  const handleCreateTemplate = React.useCallback(() => {
    setEditorDialog({ open: true, mode: "create" });
  }, []);

  const handleEditTemplate = React.useCallback((template: ConfigTemplate) => {
    setEditorDialog({ open: true, mode: "edit", template });
  }, []);

  const handleCloneTemplate = React.useCallback((template: ConfigTemplate) => {
    setEditorDialog({ open: true, mode: "clone", template });
  }, []);

  const handleRefreshTemplates = React.useCallback(() => {
    router.refresh();
  }, [router]);

  // Filter templates based on search and category
  const filteredTemplates = React.useMemo(() => {
    let filtered = templates;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter((t) => t.category === activeCategory);
    }

    return filtered;
  }, [templates, searchQuery, activeCategory]);

  // Memoized template cards
  const memoizedTemplateCards = React.useMemo(() => {
    return filteredTemplates.map((template) => {
      const isSelected = selectedTemplateId === template.id;
      const isCustom = isCustomTemplate(template.id);

      return (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={isSelected}
          onPreview={() => setPreviewTemplateId(template.id)}
          onApply={() => handleApplyTemplate(template)}
          onEdit={isCustom ? () => handleEditTemplate(template) : undefined}
          onClone={() => handleCloneTemplate(template)}
        />
      );
    });
  }, [filteredTemplates, selectedTemplateId, handleApplyTemplate, isCustomTemplate, handleEditTemplate, handleCloneTemplate]);

  // Early returns after all hooks
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="mr-2 size-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Configuration Templates</h2>
            <p className="text-muted-foreground">Browse and apply pre-configured settings</p>
          </div>
          <Button onClick={handleCreateTemplate} size="default">
            <IconPlus className="mr-2 size-4" />
            Create Template
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <IconAlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!templates.length) {
    return (
      <Alert>
        <AlertDescription>No templates available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button and Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration Templates</h2>
          <p className="text-muted-foreground">Browse and apply pre-configured settings</p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={filteredTemplates.map(t => ({
              name: t.name,
              category: t.category,
              description: t.description,
              configs: t.configs.length,
              type: t.id.startsWith("custom-") ? "Custom" : "Built-in",
            }))}
            columns={[
              { key: "name", header: "Template Name" },
              { key: "category", header: "Category" },
              { key: "description", header: "Description" },
              { key: "configs", header: "Config Count" },
              { key: "type", header: "Type" },
            ]}
            options={{
              filename: `templates-${new Date().toISOString().split("T")[0]}`,
            }}
          />
          <PDFExportButton
            data={filteredTemplates.map(t => ({
              name: t.name,
              category: t.category,
              description: t.description,
              configs: t.configs.length,
              type: t.id.startsWith("custom-") ? "Custom" : "Built-in",
            }))}
            columns={[
              { key: "name", header: "Template Name" },
              { key: "category", header: "Category" },
              { key: "description", header: "Description" },
              { key: "configs", header: "Config Count" },
              { key: "type", header: "Type" },
            ]}
            options={{
              filename: `templates-${new Date().toISOString().split("T")[0]}`,
              title: "Configuration Templates",
            }}
          />
          <Button onClick={handleCreateTemplate} size="default">
            <IconPlus className="mr-2 size-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search templates, settings, keywords..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-10"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <IconFilter className="size-4 text-muted-foreground" />
          <div className="flex gap-1">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange("all")}
            >
              All <Badge variant="secondary" className="ml-1.5">{templates.length}</Badge>
            </Button>
            {["System", "Tenant", "Service", "Compliance"].map((category) => {
              const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
              const count = templates.filter(t => t.category === category).length;
              return (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(category)}
                >
                  <Icon className="mr-1.5 size-4" />
                  {category}
                  <Badge variant="secondary" className="ml-1.5">{count}</Badge>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} matching &ldquo;{searchQuery}&rdquo;
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {memoizedTemplateCards}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No templates found. Try adjusting your search or filters.
          </p>
        </div>
      )}

      {/* Template Form Dialog */}
      {selectedTemplate && selectedTemplateId && (
        <ClientDialog open={!!selectedTemplateId} onOpenChange={() => setSelectedTemplateId(null)}>
          <ClientDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <ClientDialogHeader>
              <ClientDialogTitle>Apply Template: {selectedTemplate.name}</ClientDialogTitle>
              <ClientDialogDescription>
                Configure and apply {selectedTemplate.configs.length} settings.
              </ClientDialogDescription>
            </ClientDialogHeader>
            <EnhancedTemplateForm
              template={selectedTemplate}
              onCancel={() => setSelectedTemplateId(null)}
              onSuccess={() => {
                setSelectedTemplateId(null);
                router.push(routes.ui.admin.config());
                router.refresh();
              }}
            />
          </ClientDialogContent>
        </ClientDialog>
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <ClientDialog open={!!previewTemplateId} onOpenChange={() => setPreviewTemplateId(null)}>
          <ClientDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <ClientDialogHeader>
              <ClientDialogTitle className="flex items-center gap-2">
                {previewTemplate.name}
                <Badge variant={getScopeVariant(previewTemplate.category)}>
                  {previewTemplate.category}
                </Badge>
              </ClientDialogTitle>
              <ClientDialogDescription>{previewTemplate.description}</ClientDialogDescription>
            </ClientDialogHeader>
            <div className="space-y-6">
              {/* Template Info */}
              <div className="grid gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Configuration Fields</h4>
                  <div className="space-y-3">
                    {previewTemplate.configs.map((config, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono">{config.key}</code>
                              {config.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {config.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Default:</span>
                          <code className="bg-muted px-2 py-0.5 rounded">
                            {JSON.stringify(config.value)}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
                  {isCustomTemplate(previewTemplate.id) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreviewTemplateId(null);
                        handleEditTemplate(previewTemplate);
                      }}
                    >
                      <IconEdit className="mr-2 size-4" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewTemplateId(null);
                      handleCloneTemplate(previewTemplate);
                    }}
                  >
                    <IconCopy className="mr-2 size-4" />
                    Clone
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPreviewTemplateId(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setPreviewTemplateId(null);
                    handleApplyTemplate(previewTemplate);
                  }}>
                    Apply Template
                  </Button>
                </div>
              </div>
            </div>
          </ClientDialogContent>
        </ClientDialog>
      )}

      {/* Template Editor Dialog */}
      <EnhancedTemplateEditor
        open={editorDialog.open}
        onOpenChange={(open) =>
          setEditorDialog({ ...editorDialog, open })
        }
        template={editorDialog.template}
        mode={editorDialog.mode}
        onSuccess={() => {
          setEditorDialog({ open: false, mode: "create" });
          handleRefreshTemplates();
        }}
      />

      {/* Apply Template Confirmation */}
      <DangerZoneConfirm
        open={applyConfirm.open}
        onOpenChange={(open) =>
          setApplyConfirm({ ...applyConfirm, open })
        }
        onConfirm={handleConfirmApply}
        title="Apply Template Configuration"
        description={
          applyConfirm.template
            ? `You are about to apply "${applyConfirm.template.name}" which will create ${applyConfirm.template.configs.length} configuration${applyConfirm.template.configs.length !== 1 ? "s" : ""}. This action will modify your system settings.`
            : ""
        }
        confirmWord="APPLY"
        confirmLabel="Type APPLY to confirm"
        actionLabel="Apply Template"
        variant="warning"
      />
    </div>
  );
}
