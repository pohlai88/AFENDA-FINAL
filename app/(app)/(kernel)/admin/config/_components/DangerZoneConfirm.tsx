"use client";

/**
 * Danger Zone Confirmation Dialog
 * Requires typing a specific word to confirm critical operations
 */

import * as React from "react";
import { IconAlertTriangle, IconLock } from "@tabler/icons-react";

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
  Alert,
  AlertDescription,
} from "@afenda/shadcn";

export interface DangerZoneConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmWord: string;
  confirmLabel?: string;
  actionLabel?: string;
  variant?: "destructive" | "warning";
}

export function DangerZoneConfirm({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmWord,
  confirmLabel = "Type to confirm",
  actionLabel = "Confirm",
  variant = "destructive",
}: DangerZoneConfirmProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const isValid = inputValue === confirmWord;

  const handleConfirm = async () => {
    if (!isValid) return;

    setIsProcessing(true);
    try {
      await onConfirm();
      setInputValue("");
      onOpenChange(false);
    } catch (_error) {
      // Error handling should be done by the caller
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setInputValue("");
      onOpenChange(false);
    }
  };

  return (
    <ClientDialog open={open} onOpenChange={handleClose}>
      <ClientDialogContent className="max-w-md">
        <ClientDialogHeader>
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-full ${variant === "destructive"
                  ? "bg-red-100 dark:bg-red-950"
                  : "bg-amber-100 dark:bg-amber-950"
                }`}
            >
              <IconAlertTriangle
                className={`size-5 ${variant === "destructive"
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                  }`}
              />
            </div>
            <ClientDialogTitle>{title}</ClientDialogTitle>
          </div>
          <ClientDialogDescription className="pt-2">{description}</ClientDialogDescription>
        </ClientDialogHeader>

        <Alert
          variant={variant === "destructive" ? "destructive" : "default"}
          className={
            variant === "warning"
              ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
              : undefined
          }
        >
          <IconLock className="size-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">This action cannot be undone.</p>
              <p className="text-sm">
                Please type <code className="font-mono font-bold px-1 bg-background rounded">{confirmWord}</code> to
                confirm.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="confirm-input">{confirmLabel}</Label>
          <Input
            id="confirm-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Type "${confirmWord}" here`}
            className={
              inputValue && !isValid
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : undefined
            }
            disabled={isProcessing}
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid) {
                handleConfirm();
              }
            }}
          />
          {inputValue && !isValid && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Confirmation word does not match
            </p>
          )}
        </div>

        <ClientDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!isValid || isProcessing}
          >
            {isProcessing ? "Processing..." : actionLabel}
          </Button>
        </ClientDialogFooter>
      </ClientDialogContent>
    </ClientDialog>
  );
}
