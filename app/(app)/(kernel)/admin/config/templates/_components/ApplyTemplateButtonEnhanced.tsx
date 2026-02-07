"use client";

/**
 * Enhanced Apply Template Button with Search
 * Enterprise-grade template selection with comprehensive search
 */

import * as React from "react";
import { IconSettings } from "@tabler/icons-react";
import {
  Button,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogHeader,
  ClientDialogTitle,
} from "@afenda/shadcn";
import { cn } from "@afenda/shadcn/lib/utils";

import { SearchableTemplateSelector } from "./SearchableTemplateSelector";
import { EnhancedTemplateForm } from "./EnhancedTemplateForm";
import type { ConfigTemplate } from "@afenda/orchestra/zod";

interface ApplyTemplateButtonEnhancedProps {
  onApply: (template: ConfigTemplate) => void;
  selectedTemplateId?: string;
  disabled?: boolean;
  className?: string;
}

export function ApplyTemplateButtonEnhanced({
  onApply: _onApply,
  selectedTemplateId,
  disabled = false,
  className,
}: ApplyTemplateButtonEnhancedProps) {
  const [showSelector, setShowSelector] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<ConfigTemplate | null>(null);
  const handleTemplateSelect = React.useCallback((template: ConfigTemplate) => {
    setSelectedTemplate(template);
    setShowForm(true);
  }, []);

  const handleTemplatePreview = React.useCallback((_template: ConfigTemplate) => {
    // Could open a preview dialog or navigate to preview
  }, []);

  const handleFormCancel = React.useCallback(() => {
    setShowForm(false);
    setSelectedTemplate(null);
  }, []);

  const handleFormSuccess = React.useCallback(() => {
    setShowForm(false);
    setShowSelector(false);
    setSelectedTemplate(null);
  }, []);

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className={cn("flex-1", className)}
        onClick={() => setShowSelector(true)}
        disabled={disabled}
      >
        <IconSettings className="mr-1.5 size-4" />
        Apply Template
      </Button>

      {/* Template Selector Dialog */}
      <ClientDialog open={showSelector} onOpenChange={setShowSelector}>
        <ClientDialogContent className="max-w-6xl max-h-[90vh]">
          <ClientDialogHeader>
            <ClientDialogTitle className="flex items-center gap-2">
              <IconSettings className="size-5" />
              Select Template to Apply
            </ClientDialogTitle>
            <ClientDialogDescription>
              Choose from {selectedTemplateId ? "all available" : "the best"} templates to configure your system
            </ClientDialogDescription>
          </ClientDialogHeader>

          <SearchableTemplateSelector
            onTemplateSelect={handleTemplateSelect}
            onTemplatePreview={handleTemplatePreview}
            selectedTemplateId={selectedTemplateId}
            maxVisible={50} // Show more results in selector
            showCategories={true}
            showTypeFilters={true}
          />
        </ClientDialogContent>
      </ClientDialog>

      {/* Template Form Dialog */}
      <ClientDialog open={showForm} onOpenChange={setShowForm}>
        <ClientDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ClientDialogHeader>
            <ClientDialogTitle className="flex items-center gap-2">
              <IconSettings className="size-5" />
              Apply Template: {selectedTemplate?.name}
            </ClientDialogTitle>
            <ClientDialogDescription>
              Configure and apply {selectedTemplate?.configs.length || 0} settings to your system
            </ClientDialogDescription>
          </ClientDialogHeader>

          {selectedTemplate && (
            <EnhancedTemplateForm
              template={selectedTemplate}
              onCancel={handleFormCancel}
              onSuccess={handleFormSuccess}
            />
          )}
        </ClientDialogContent>
      </ClientDialog>
    </>
  );
}
