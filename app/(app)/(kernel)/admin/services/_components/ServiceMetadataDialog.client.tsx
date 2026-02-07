/**
 * Service Metadata Dialog
 * Edit service metadata, contact, and health check settings
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  Button,
  Input,
  Label,
} from "@afenda/shadcn";
import { toast } from "sonner";
import { routes } from "@afenda/shared/constants";

interface ServiceMetadata {
  description?: string;
  version?: string;
  tags?: string[];
  ownerContact?: string;
  documentationUrl?: string;
  healthCheckIntervalMs?: number;
  healthCheckTimeoutMs?: number;
}

interface ServiceMetadataDialogProps {
  serviceId: string;
  currentMetadata: ServiceMetadata;
  open: boolean;
  onClose: () => void;
}

export function ServiceMetadataDialog({
  serviceId,
  currentMetadata,
  open,
  onClose,
}: ServiceMetadataDialogProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ServiceMetadata>(currentMetadata);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(routes.api.orchestra.serviceById(serviceId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.ok) {
        toast.error(result.error?.message || "Failed to update service metadata");
        return;
      }

      toast.success("Service metadata updated successfully");

      router.refresh();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ClientDialog open={open} onOpenChange={onClose}>
      <ClientDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ClientDialogHeader>
          <ClientDialogTitle>Service Metadata: {serviceId}</ClientDialogTitle>
          <ClientDialogDescription>
            Update service information and health check settings
          </ClientDialogDescription>
        </ClientDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of the service"
              maxLength={256}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={formData.version || ""}
              onChange={(e) =>
                setFormData({ ...formData, version: e.target.value })
              }
              placeholder="e.g., 1.0.0"
              maxLength={32}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags?.join(", ") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                })
              }
              placeholder="e.g., api, backend, critical"
            />
          </div>

          {/* Contact & Docs */}
          <div className="space-y-2">
            <Label htmlFor="ownerContact">Owner Contact</Label>
            <Input
              id="ownerContact"
              value={formData.ownerContact || ""}
              onChange={(e) =>
                setFormData({ ...formData, ownerContact: e.target.value })
              }
              placeholder="Email or Slack handle"
              maxLength={128}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentationUrl">Documentation URL</Label>
            <Input
              id="documentationUrl"
              type="url"
              value={formData.documentationUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, documentationUrl: e.target.value })
              }
              placeholder="https://docs.example.com/service"
            />
          </div>

          {/* Health Check Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="healthCheckIntervalMs">
                Health Check Interval (ms)
              </Label>
              <Input
                id="healthCheckIntervalMs"
                type="number"
                min={5000}
                max={300000}
                step={1000}
                value={formData.healthCheckIntervalMs || 30000}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    healthCheckIntervalMs: parseInt(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                5s - 300s (default: 30s)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthCheckTimeoutMs">
                Health Check Timeout (ms)
              </Label>
              <Input
                id="healthCheckTimeoutMs"
                type="number"
                min={1000}
                max={60000}
                step={1000}
                value={formData.healthCheckTimeoutMs || 5000}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    healthCheckTimeoutMs: parseInt(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                1s - 60s (default: 5s)
              </p>
            </div>
          </div>

          <ClientDialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </ClientDialogFooter>
        </form>
      </ClientDialogContent>
    </ClientDialog>
  );
}
