"use client";

/**
 * Config Create Dialog
 * Create new configuration key with audit logging.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
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
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

export interface ConfigCreateDialogProps {
  variant?: "default" | "outline";
  className?: string;
}

export function ConfigCreateDialog({ variant = "default", className }: ConfigCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");
  const [scope, setScope] = React.useState("global");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fullKey = `${scope}.${key}`;
  const isValid = key.length > 0 && value.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    // Show optimistic success toast immediately
    const toastId = toast.loading(`Creating ${fullKey}...`);

    try {
      // Parse value as JSON if it looks like JSON, otherwise use as string
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }

      const response = await fetch(routes.api.orchestra.configKey(fullKey), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parsedValue,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to create configuration");
      }

      // Update toast to success
      toast.success(`Configuration ${fullKey} created successfully`, { id: toastId });

      // Reset form and close dialog
      setKey("");
      setValue("");
      setScope("global");
      setDescription("");
      setOpen(false);

      // Refresh to show new config
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create configuration";

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
        <Button variant={variant} size="sm" className={className}>
          <IconPlus className="mr-2 size-4" />
          Add Configuration
        </Button>
      </ClientDialogTrigger>
      <ClientDialogContent>
        <ClientDialogHeader>
          <ClientDialogTitle>Add Configuration</ClientDialogTitle>
          <ClientDialogDescription>
            Create a new configuration key. The change will be audited.
          </ClientDialogDescription>
        </ClientDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="scope">Scope</Label>
              <ClientSelect value={scope} onValueChange={setScope}>
                <ClientSelectTrigger>
                  <ClientSelectValue placeholder="Select scope" />
                </ClientSelectTrigger>
                <ClientSelectContent>
                  <ClientSelectItem value="global">Global</ClientSelectItem>
                  <ClientSelectItem value="tenant">Tenant</ClientSelectItem>
                  <ClientSelectItem value="service">Service</ClientSelectItem>
                </ClientSelectContent>
              </ClientSelect>
              <p className="text-xs text-muted-foreground">
                Scope determines who can modify this configuration.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="key">Key Name</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                className="font-mono"
                placeholder="feature.enabled"
              />
              {key && (
                <p className="text-xs text-muted-foreground">
                  Full key: <code className="bg-muted px-1 rounded">{fullKey}</code>
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value">Value</Label>
              <Textarea
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="font-mono min-h-[80px]"
                placeholder="true, 123, or {&quot;key&quot;: &quot;value&quot;}"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this configuration controls..."
              />
            </div>

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
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Configuration"}
            </Button>
          </ClientDialogFooter>
        </form>
      </ClientDialogContent>
    </ClientDialog>
  );
}
