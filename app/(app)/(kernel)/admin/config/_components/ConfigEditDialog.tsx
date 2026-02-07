"use client";

/**
 * Config Edit Dialog
 * Edit configuration with change preview and audit logging.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconEdit, IconAlertTriangle } from "@tabler/icons-react";
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
  Input,
  Label,
  Textarea,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

export interface ConfigEditDialogProps {
  config: {
    key: string;
    value?: unknown;
    description: string | null;
    updatedAt: string | Date;
    createdAt?: string | Date;
    updatedBy: string | null;
  };
}

export function ConfigEditDialog({ config }: ConfigEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(formatValue(config.value));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const originalValue = formatValue(config.value);
  const hasChanges = value !== originalValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setIsSubmitting(true);
    setError(null);

    // Show optimistic loading toast
    const toastId = toast.loading(`Updating ${config.key}...`);

    try {
      // Parse value as JSON if it looks like JSON, otherwise use as string
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }

      const response = await fetch(routes.api.orchestra.configKey(config.key), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: parsedValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to update configuration");
      }

      // Update toast to success
      toast.success(`Configuration ${config.key} updated successfully`, { id: toastId });

      setOpen(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update configuration";

      // Update toast to error
      toast.error(errorMessage, { id: toastId });

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconEdit className="size-4" />
          <span className="sr-only">Edit configuration</span>
        </Button>
      </ClientDialogTrigger>
      <ClientDialogContent>
        <ClientDialogHeader>
          <ClientDialogTitle>Edit Configuration</ClientDialogTitle>
          <ClientDialogDescription>
            Modify the configuration value. Changes will be audited.
          </ClientDialogDescription>
        </ClientDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={config.key}
                disabled
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value">Value</Label>
              <Textarea
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="font-mono min-h-[100px]"
                placeholder="Enter value (JSON or string)"
              />
            </div>

            {hasChanges && (
              <Alert>
                <IconAlertTriangle className="size-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Change Preview</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-red-500">- </span>
                        <span className="line-through">{originalValue}</span>
                      </div>
                      <div>
                        <span className="text-green-500">+ </span>
                        <span>{value}</span>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <ClientDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </ClientDialogFooter>
        </form>
      </ClientDialogContent>
    </ClientDialog>
  );
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}
