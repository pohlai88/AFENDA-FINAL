"use client";

/**
 * Restore Card
 * Enterprise-grade backup restore with Server Actions and progressive enhancement.
 * 
 * Features:
 * - Server Actions with useActionState (Next.js 16)
 * - Progressive enhancement (works without JS)
 * - Official shadcn/ui components
 * - No hardcoded values
 * - Production-ready error handling
 * - File validation and size display
 * - Toast notifications with sonner
 */

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { IconHistory, IconAlertTriangle, IconLoader2, IconFileUpload } from "@tabler/icons-react";

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
  Input,
  Label,
  Badge,
} from "@afenda/shadcn";
import { restoreFromBackupAction } from "../_actions/backup.actions";

export function RestoreCard() {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [backupId, setBackupId] = React.useState<string>("");

  // Use Server Action with useActionState for progressive enhancement
  const [state, formAction, isPending] = useActionState(restoreFromBackupAction, null);

  // Helper functions
  const resetDialog = React.useCallback(() => {
    setFile(null);
    setBackupId("");
    setOpen(false);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validExtensions = [".enc", ".backup", ".json"];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf("."));

      if (!validExtensions.includes(fileExtension)) {
        toast.error("Invalid file type", {
          description: "Please select a valid backup file (.enc, .backup, or .json)",
        });
        return;
      }

      setFile(selectedFile);
      // Extract backup ID from filename if possible
      const idMatch = selectedFile.name.match(/backup-([a-f0-9-]+)/i);
      if (idMatch) {
        setBackupId(idMatch[1]);
      }
    }
  };

  // Show toast notifications based on state
  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Restore completed successfully", {
        description: "System has been restored from backup",
      });
      resetDialog();
    } else if (state?.ok === false) {
      toast.error("Restore failed", {
        description: state.error?.message || "Failed to restore from backup",
      });
    }
  }, [state, resetDialog]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconHistory className="size-5" />
          Restore from Backup
        </CardTitle>
        <CardDescription>
          Restore system state from an encrypted backup file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive-foreground">
            <strong>Warning:</strong> Restoring will overwrite current data. This
            operation cannot be undone. Ensure you have a recent backup before proceeding.
          </p>
        </div>

        <ClientDialog open={open} onOpenChange={(v) => { if (!v) resetDialog(); else setOpen(v); }}>
          <ClientDialogTrigger asChild>
            <Button variant="outline" className="w-full" size="lg">
              <IconHistory className="mr-2 size-4" />
              Restore from Backup
            </Button>
          </ClientDialogTrigger>
          <ClientDialogContent className="sm:max-w-[500px]">
            <form action={formAction}>
              <ClientDialogHeader>
                <ClientDialogTitle>Restore System from Backup</ClientDialogTitle>
                <ClientDialogDescription>
                  Upload an encrypted backup file to restore the system state.
                </ClientDialogDescription>
              </ClientDialogHeader>

              <div className="space-y-4 py-4">
                <Alert variant="destructive">
                  <IconAlertTriangle className="size-4" />
                  <AlertDescription>
                    <strong>Critical Warning:</strong> This will overwrite all current
                    data. This operation cannot be undone. Proceed with caution.
                  </AlertDescription>
                </Alert>

                {/* File Upload */}
                <div className="space-y-3">
                  <Label htmlFor="backupFile" className="text-base font-semibold">
                    Select Backup File
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="backupFile"
                        name="backupFile"
                        type="file"
                        accept=".enc,.backup,.json"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  {file && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                      <IconFileUpload className="size-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {formatFileSize(file.size)}
                          </Badge>
                          {file.name.endsWith(".enc") && (
                            <Badge variant="default" className="text-xs">
                              Encrypted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hidden input for backup ID */}
                <input type="hidden" name="backupId" value={backupId} />

                {/* Error Display */}
                {state?.ok === false && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {state.error?.message || "Failed to restore from backup"}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Info */}
                {!file && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Accepted file types:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>.enc (Encrypted backup)</li>
                      <li>.backup (Standard backup)</li>
                      <li>.json (JSON backup)</li>
                    </ul>
                  </div>
                )}
              </div>

              <ClientDialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetDialog}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!file || isPending}
                >
                  {isPending ? (
                    <>
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <IconHistory className="mr-2 size-4" />
                      Confirm Restore
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
