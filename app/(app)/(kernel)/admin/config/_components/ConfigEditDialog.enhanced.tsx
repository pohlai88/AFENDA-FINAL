"use client";

/**
 * Enhanced Config Edit Dialog
 * Steve Jobs-inspired: Clear preview of changes before committing.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconEdit, IconAlertCircle, IconArrowRight, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  Button,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Textarea,
  Alert,
  AlertDescription,
  Card,
  CardContent,
  Badge,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

export interface ConfigEditDialogEnhancedProps {
  config: {
    key: string;
    value?: unknown;
    description: string | null;
    updatedAt: string | Date;
    createdAt?: string | Date;
    updatedBy: string | null;
  };
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

/**
 * Detect value type
 */
function detectValueType(value: string): { type: string; parsed: unknown; valid: boolean } {
  if (!value) return { type: "empty", parsed: null, valid: false };

  // Boolean
  if (value === "true" || value === "false") {
    return { type: "boolean", parsed: value === "true", valid: true };
  }

  // Number
  if (!isNaN(Number(value)) && value.trim() !== "") {
    return { type: "number", parsed: Number(value), valid: true };
  }

  // JSON Object/Array
  if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
    try {
      const parsed = JSON.parse(value);
      return { type: Array.isArray(parsed) ? "array" : "object", parsed, valid: true };
    } catch {
      return { type: "json", parsed: null, valid: false };
    }
  }

  // String
  return { type: "string", parsed: value, valid: true };
}

export function ConfigEditDialogEnhanced({ config }: ConfigEditDialogEnhancedProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(formatValue(config.value));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const originalValue = formatValue(config.value);
  const hasChanges = value !== originalValue;

  const originalAnalysis = React.useMemo(() => detectValueType(originalValue), [originalValue]);
  const newAnalysis = React.useMemo(() => detectValueType(value), [value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || !newAnalysis.valid) return;

    setIsSubmitting(true);
    setError(null);

    const toastId = toast.loading(`Updating ${config.key}...`);

    try {
      const response = await fetch(routes.api.orchestra.configKey(config.key), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newAnalysis.parsed }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to update configuration");
      }

      toast.success(
        <div className="flex items-center gap-2">
          <IconCheck className="size-4" />
          <span>Configuration updated</span>
        </div>,
        { id: toastId }
      );

      setOpen(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update configuration";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <IconEdit className="size-4" />
          <span className="sr-only">Edit configuration</span>
        </Button>
      </ClientDialogTrigger>
      <ClientDialogContent className="max-w-3xl">
        <ClientDialogHeader>
          <ClientDialogTitle>Edit Configuration</ClientDialogTitle>
          <ClientDialogDescription>
            Make changes. See the difference. Every edit is logged.
          </ClientDialogDescription>
        </ClientDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Key Display */}
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground mb-1">Configuration Key</div>
            <code className="text-sm font-mono font-medium">{config.key}</code>
          </div>

          {/* Value Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">New Value</label>
              {newAnalysis.valid && (
                <Badge variant="outline" className="text-xs">
                  {newAnalysis.type}
                </Badge>
              )}
            </div>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="font-mono min-h-[120px] text-sm"
              placeholder='Enter value: "text", 123, true, {"key": "value"}'
            />
            {!newAnalysis.valid && value && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <IconAlertCircle className="size-3" />
                Invalid {newAnalysis.type} format
              </div>
            )}
          </div>

          {/* Change Preview */}
          {hasChanges && newAnalysis.valid && (
            <Card className="border-dashed border-2">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Change Preview</h4>
                    {originalAnalysis.type !== newAnalysis.type && (
                      <Badge variant="secondary" className="text-xs">
                        Type changed: {originalAnalysis.type} → {newAnalysis.type}
                      </Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Before */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="size-2 rounded-full bg-red-500" />
                        <span className="font-medium">Before</span>
                      </div>
                      <div className="rounded-md bg-red-50 dark:bg-red-950/20 p-3 border border-red-200 dark:border-red-900">
                        <pre className="text-xs font-mono text-red-900 dark:text-red-300 overflow-x-auto">
                          {JSON.stringify(originalAnalysis.parsed, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex items-center justify-center">
                      <IconArrowRight className="size-6 text-muted-foreground" />
                    </div>

                    {/* After */}
                    <div className="space-y-2 md:col-start-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="size-2 rounded-full bg-green-500" />
                        <span className="font-medium">After</span>
                      </div>
                      <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-3 border border-green-200 dark:border-green-900">
                        <pre className="text-xs font-mono text-green-900 dark:text-green-300 overflow-x-auto">
                          {JSON.stringify(newAnalysis.parsed, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Change Summary */}
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      <strong>What&apos;s changing:</strong> The value will be updated and this change will be permanently logged in the audit trail.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Changes Notice */}
          {!hasChanges && (
            <Alert>
              <AlertDescription className="text-sm">
                No changes detected. Modify the value above to see a preview.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <IconAlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Meta Information */}
          {config.description && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Description: </span>
              <span>{config.description}</span>
            </div>
          )}

          <ClientDialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || !newAnalysis.valid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </ClientDialogFooter>
        </form>
      </ClientDialogContent>
    </ClientDialog>
  );
}
