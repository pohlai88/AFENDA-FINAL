"use client";

/**
 * Apply Template Button - Steve Jobs Inspired
 * Beautiful. Intuitive. Clear.
 */

import * as React from "react";
import { IconCheck, IconLoader2, IconEye, IconSettings } from "@tabler/icons-react";
import {
  Button,
  ClientAlertDialog,
  ClientAlertDialogAction,
  ClientAlertDialogCancel,
  ClientAlertDialogContent,
  ClientAlertDialogDescription,
  ClientAlertDialogFooter,
  ClientAlertDialogHeader,
  ClientAlertDialogTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@afenda/shadcn";
import { cn } from "@afenda/shadcn/lib/utils";

import type { ConfigTemplate } from "@afenda/orchestra/zod";

interface ApplyTemplateButtonProps {
  template: ConfigTemplate;
  onApply: (template: ConfigTemplate) => void;
  onPreview?: (template: ConfigTemplate) => void;
  isApplied?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ApplyTemplateButton({
  template,
  onApply,
  onPreview,
  isApplied = false,
  disabled = false,
  className,
}: ApplyTemplateButtonProps) {
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(template);
      setShowConfirm(false);
    } finally {
      setIsApplying(false);
    }
  };

  if (isApplied) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className={cn("flex-1", className)}
        disabled
      >
        <IconCheck className="mr-1.5 size-4" />
        Applied
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className={cn("flex-1", className)}
        onClick={() => setShowConfirm(true)}
        disabled={disabled}
      >
        <IconSettings className="mr-1.5 size-4" />
        Apply Template
      </Button>

      <ClientAlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <ClientAlertDialogContent className="max-w-2xl">
          <ClientAlertDialogHeader>
            <ClientAlertDialogTitle className="flex items-center gap-2">
              <IconSettings className="size-5" />
              Apply &ldquo;{template.name}&rdquo;
            </ClientAlertDialogTitle>
            <ClientAlertDialogDescription>
              This template will configure {template.configs.length} setting{template.configs.length !== 1 ? "s" : ""} on your system.
            </ClientAlertDialogDescription>
          </ClientAlertDialogHeader>

          {/* Template Preview */}
          <div className="my-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Template Overview</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{template.category}</Badge>
                  <Badge variant="secondary">{template.configs.length} settings</Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Configuration Preview</h4>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {template.configs.slice(0, 5).map((config) => (
                      <div key={config.key} className="flex items-center justify-between text-sm">
                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {config.key}
                        </code>
                        <div className="flex items-center gap-2">
                          {config.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {config.validation.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {template.configs.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... and {template.configs.length - 5} more settings
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <ClientAlertDialogFooter className="flex-col sm:flex-row gap-2">
            {onPreview && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  onPreview(template);
                }}
                className="w-full sm:w-auto"
              >
                <IconEye className="mr-2 size-4" />
                Preview All Settings
              </Button>
            )}
            <ClientAlertDialogCancel asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </ClientAlertDialogCancel>
            <ClientAlertDialogAction asChild>
              <Button
                onClick={handleApply}
                disabled={isApplying}
                className="w-full sm:w-auto"
              >
                {isApplying ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <IconCheck className="mr-2 size-4" />
                    Apply Template
                  </>
                )}
              </Button>
            </ClientAlertDialogAction>
          </ClientAlertDialogFooter>
        </ClientAlertDialogContent>
      </ClientAlertDialog>
    </>
  );
}
