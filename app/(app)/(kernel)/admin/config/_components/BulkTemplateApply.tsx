"use client";

/**
 * Bulk Template Apply
 * Apply multiple configuration templates at once with preview and validation.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Button,
  Card,
  CardContent,
  Checkbox,
  Badge,
  Alert,
  AlertDescription,
  Progress,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { toast } from "sonner";
import { ConfigDiffList } from "./ConfigDiffViewer";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  configs: Array<{
    key: string;
    value: unknown;
    description?: string;
  }>;
}

interface BulkTemplateApplyProps {
  templates: Template[];
  trigger?: React.ReactNode;
}

interface ApplyProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export function BulkTemplateApply({ templates, trigger }: BulkTemplateApplyProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [progress, setProgress] = React.useState<ApplyProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const selectedTemplates = templates.filter((t) => selectedIds.has(t.id));
  const totalConfigs = selectedTemplates.reduce((sum, t) => sum + t.configs.length, 0);

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(templates.map((t) => t.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleApply = async () => {
    if (selectedTemplates.length === 0) return;

    setIsApplying(true);
    setError(null);
    setProgress({
      total: selectedTemplates.length,
      completed: 0,
      failed: 0,
    });

    const toastId = toast.loading(`Applying ${selectedTemplates.length} templates...`);

    try {
      let completed = 0;
      let failed = 0;

      for (const template of selectedTemplates) {
        setProgress((prev) => ({
          ...prev!,
          current: template.name,
        }));

        try {
          const response = await fetch(routes.api.orchestra.configTemplatesOps("apply"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId: template.id }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message ?? "Failed to apply template");
          }

          completed++;
          setProgress((prev) => ({
            ...prev!,
            completed,
          }));
        } catch (err) {
          failed++;
          setProgress((prev) => ({
            ...prev!,
            failed,
          }));
          console.error(`Failed to apply template ${template.name}:`, err);
        }
      }

      // Show final result
      if (failed === 0) {
        toast.success(`Successfully applied ${completed} templates`, { id: toastId });
      } else if (completed === 0) {
        toast.error(`Failed to apply all ${failed} templates`, { id: toastId });
      } else {
        toast.warning(
          `Applied ${completed} templates, ${failed} failed`,
          { id: toastId }
        );
      }

      // Close dialog and refresh
      setOpen(false);
      setShowPreview(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to apply templates";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
    } finally {
      setIsApplying(false);
      setProgress(null);
    }
  };

  // Generate preview diffs
  const previewDiffs = selectedTemplates.flatMap((template) =>
    template.configs.map((config) => ({
      key: config.key,
      oldValue: null, // Assuming new configs
      newValue: config.value,
    }))
  );

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            Apply Multiple Templates
          </Button>
        )}
      </ClientDialogTrigger>
      <ClientDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ClientDialogHeader>
          <ClientDialogTitle>
            {showPreview ? "Preview Changes" : "Bulk Template Application"}
          </ClientDialogTitle>
          <ClientDialogDescription>
            {showPreview
              ? `Review ${totalConfigs} configuration changes from ${selectedTemplates.length} templates`
              : "Select multiple templates to apply at once"}
          </ClientDialogDescription>
        </ClientDialogHeader>

        {!showPreview ? (
          // Template selection view
          <div className="space-y-4">
            {/* Selection controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedIds.size} of {templates.length} templates selected
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            {/* Template list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-colors ${
                    selectedIds.has(template.id)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => toggleTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.has(template.id)}
                        onCheckedChange={() => toggleTemplate(template.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="secondary">{template.category}</Badge>
                          <Badge variant="outline">
                            {template.configs.length} configs
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          // Preview view
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                The following {totalConfigs} configurations will be created or updated.
                Review carefully before applying.
              </AlertDescription>
            </Alert>

            <ConfigDiffList diffs={previewDiffs} title="" />
          </div>
        )}

        {/* Progress indicator */}
        {isApplying && progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                Applying templates... ({progress.completed + progress.failed}/{progress.total})
              </span>
              {progress.current && (
                <span className="text-muted-foreground">{progress.current}</span>
              )}
            </div>
            <Progress
              value={((progress.completed + progress.failed) / progress.total) * 100}
            />
            {progress.failed > 0 && (
              <p className="text-sm text-destructive">
                {progress.failed} template{progress.failed > 1 ? "s" : ""} failed
              </p>
            )}
          </div>
        )}

        <ClientDialogFooter>
          {!showPreview ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={selectedIds.size === 0}
              >
                Preview Changes ({totalConfigs} configs)
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={isApplying}
              >
                Back
              </Button>
              <Button
                onClick={handleApply}
                disabled={isApplying}
              >
                {isApplying ? "Applying..." : `Apply ${selectedTemplates.length} Templates`}
              </Button>
            </>
          )}
        </ClientDialogFooter>
      </ClientDialogContent>
    </ClientDialog>
  );
}
