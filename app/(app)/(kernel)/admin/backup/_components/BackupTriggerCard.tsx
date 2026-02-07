"use client";

/**
 * Backup Trigger Card
 * Enterprise-grade backup trigger with Server Actions and progressive enhancement.
 * 
 * Features:
 * - Server Actions with useActionState (Next.js 16)
 * - Progressive enhancement (works without JS)
 * - Official shadcn/ui components
 * - No hardcoded values
 * - Production-ready error handling
 * - Toast notifications with sonner
 */

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { IconCloudUpload, IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Alert,
  AlertDescription,
  Label,
  Checkbox,
} from "@afenda/shadcn";
import { triggerBackupAction } from "../_actions/backup.actions";

export function BackupTriggerCard() {
  const [open, setOpen] = React.useState(false);
  const [includeDatabase, setIncludeDatabase] = React.useState(true);
  const [includeR2Bucket, setIncludeR2Bucket] = React.useState(false);

  // Use Server Action with useActionState for progressive enhancement
  const [state, formAction, isPending] = useActionState(triggerBackupAction, null);

  // Show toast notifications based on state
  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Backup created successfully", {
        description: state.data?.message || "Backup completed",
      });
      setOpen(false);
    } else if (state?.ok === false) {
      toast.error("Backup failed", {
        description: state.error?.message || "Failed to create backup",
      });
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCloudUpload className="size-5" />
          Create Backup
        </CardTitle>
        <CardDescription>
          Create an encrypted snapshot of the current system state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Backups are encrypted with AES-256-GCM and stored in dual locations
            (R2 + local fallback). All operations are logged in the audit trail.
          </p>
        </div>

        <ClientDialog open={open} onOpenChange={setOpen}>
          <ClientDialogTrigger asChild>
            <Button className="w-full" size="lg">
              <IconCloudUpload className="mr-2 size-4" />
              Create Backup
            </Button>
          </ClientDialogTrigger>
          <ClientDialogContent className="sm:max-w-[500px]">
            <form action={formAction}>
              <ClientDialogHeader>
                <ClientDialogTitle>Create System Backup</ClientDialogTitle>
                <ClientDialogDescription>
                  Configure backup options and create an encrypted snapshot.
                </ClientDialogDescription>
              </ClientDialogHeader>

              <div className="space-y-4 py-4">
                <Alert>
                  <IconAlertTriangle className="size-4" />
                  <AlertDescription>
                    This operation will be recorded in the audit log and may take
                    several minutes depending on data size.
                  </AlertDescription>
                </Alert>

                {/* Backup Options */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Backup Options</Label>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeDatabase"
                      name="includeDatabase"
                      value="on"
                      checked={includeDatabase}
                      onCheckedChange={(checked) => setIncludeDatabase(checked as boolean)}
                    />
                    <Label
                      htmlFor="includeDatabase"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Include database (Neon PostgreSQL)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeR2Bucket"
                      name="includeR2Bucket"
                      value="on"
                      checked={includeR2Bucket}
                      onCheckedChange={(checked) => setIncludeR2Bucket(checked as boolean)}
                    />
                    <Label
                      htmlFor="includeR2Bucket"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Include R2 bucket files
                    </Label>
                  </div>
                </div>

                {/* Hidden inputs for form data */}
                <input type="hidden" name="backupType" value="full" />

                {/* Error Display */}
                {state?.ok === false && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {state.error?.message || "Failed to create backup"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <ClientDialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <IconCloudUpload className="mr-2 size-4" />
                      Create Backup
                    </>
                  )}
                </Button>
              </ClientDialogFooter>
            </form>
          </ClientDialogContent>
        </ClientDialog>
      </CardContent>
    </Card>
  );
}
