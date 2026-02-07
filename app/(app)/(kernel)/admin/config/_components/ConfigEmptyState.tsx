"use client";

/**
 * Enhanced Empty State for Configuration Page
 * Educational content with quick start guide and actionable paths.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconSettings,
  IconTemplate,
  IconBook,
  IconBulb,
  IconRocket,
  IconServer,
  IconBuilding,
  IconShieldCheck,
  IconLoader2,
} from "@tabler/icons-react";

import { routes } from "@afenda/shared/constants";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";

import { ConfigCreateDialog } from "./ConfigCreateDialog";

// Quick preset definitions for one-click setup
const QUICK_PRESETS = [
  {
    id: "production",
    name: "Production",
    description: "Secure, optimized settings",
    icon: IconServer,
    templateCount: 10,
  },
  {
    id: "development",
    name: "Development",
    description: "Debug-friendly settings",
    icon: IconBuilding,
    templateCount: 4,
  },
  {
    id: "staging",
    name: "Staging",
    description: "Production-like testing",
    icon: IconShieldCheck,
    templateCount: 8,
  },
];

export function ConfigEmptyState() {
  const router = useRouter();
  const [isApplying, setIsApplying] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleApplyPreset = async (presetId: string) => {
    setIsApplying(presetId);
    setError(null);

    try {
      const response = await fetch(
        routes.api.orchestra.configTemplatesOps("apply-preset"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ presetId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to apply preset");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply preset");
    } finally {
      setIsApplying(null);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 max-w-2xl mx-auto">
      {/* Visual */}
      <div className="relative">
        <IconSettings className="size-16 text-muted-foreground/30" />
        <Badge className="absolute -top-2 -right-2" variant="default">New</Badge>
      </div>

      {/* Heading */}
      <h3 className="mt-6 text-lg font-semibold">
        Welcome to Configuration Management
      </h3>

      {/* Educational Content */}
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
        Configure your system with pre-built templates or create custom settings.
        All changes are audited and require appropriate permissions.
      </p>

      {/* Quick Start Guide */}
      <Card className="mt-6 w-full border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IconBulb className="size-4" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <div className="flex-1">
              <p className="text-sm font-medium">Choose a Configuration Template</p>
              <p className="text-xs text-muted-foreground">
                Start with pre-built templates for common scenarios
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <div className="flex-1">
              <p className="text-sm font-medium">Customize Values</p>
              <p className="text-xs text-muted-foreground">
                Adjust settings to match your requirements
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <div className="flex-1">
              <p className="text-sm font-medium">Review & Apply</p>
              <p className="text-xs text-muted-foreground">
                Changes are validated and logged automatically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <Card className="mt-6 w-full border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IconRocket className="size-4" />
            Quick Setup Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {QUICK_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <Button
                  key={preset.id}
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-1"
                  disabled={isApplying !== null}
                  onClick={() => handleApplyPreset(preset.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {isApplying === preset.id ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                    <span className="font-medium">{preset.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {preset.description}
                  </span>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {preset.templateCount} configs
                  </Badge>
                </Button>
              );
            })}
          </div>
          {error && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Primary Actions */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Button size="lg" className="gap-2" asChild>
          <Link href={routes.ui.admin.configTemplates()}>
            <IconTemplate className="size-4" />
            Browse All Templates
          </Link>
        </Button>
        <ConfigCreateDialog variant="outline" className="h-11 text-base px-8" />
      </div>

      {/* Help Link */}
      <Button variant="link" className="mt-4" asChild>
        <Link href={routes.ui.admin.root()}>
          <IconBook className="mr-2 size-4" />
          Back to Admin Dashboard
        </Link>
      </Button>
    </div>
  );
}
