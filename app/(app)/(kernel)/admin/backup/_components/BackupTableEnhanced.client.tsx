"use client";

/**
 * Enhanced Backup History Table with Advanced DataTable
 * Enterprise-grade component with Server Actions integration.
 * 
 * Features:
 * - Server Actions for delete operations
 * - Encryption and storage status badges
 * - Download button with streaming
 * - Search and filter capabilities
 * - Export to CSV, Excel, PDF
 * - Bulk operations
 */

import * as React from "react";
import { useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconDownload,
  IconTrash,
  IconDatabase,
  IconLock,
  IconCloud,
  IconServer,
  IconShieldCheck,
  IconReplace,
} from "@tabler/icons-react";
import { deleteBackupAction } from "../_actions/backup.actions";
import { BackupVerification } from "./BackupVerification";
import { SelectiveRestore } from "./SelectiveRestore";

import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

export interface BackupEntry {
  id: string;
  filename: string;
  type: "full" | "incremental" | "differential";
  size: number;
  duration: number;
  status: "success" | "failed" | "in-progress";
  createdBy: string | null;
  createdAt: Date | string;
  storageProvider?: string;
  encrypted?: boolean;
  encryptionAlgorithm?: string | null;
  checksum?: string;
  metadata?: Record<string, unknown>;
}

export interface BackupTableEnhancedProps {
  backups: BackupEntry[];
}

function getTypeBadgeConfig(type: string): { className: string; label: string } {
  switch (type) {
    case "full":
      return {
        className: "text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950",
        label: "Full",
      };
    case "incremental":
      return {
        className: "text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950",
        label: "Incremental",
      };
    case "differential":
      return {
        className: "text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950",
        label: "Differential",
      };
    default:
      return {
        className: "text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950",
        label: type,
      };
  }
}

function getStatusBadgeConfig(status: string): { className: string; label: string } {
  switch (status) {
    case "success":
      return {
        className: "text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950",
        label: "Success",
      };
    case "failed":
      return {
        className: "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950",
        label: "Failed",
      };
    case "in-progress":
      return {
        className: "text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950",
        label: "In Progress",
      };
    default:
      return {
        className: "text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950",
        label: status,
      };
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BackupTableEnhanced({ backups }: BackupTableEnhancedProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = React.useCallback((backupId: string) => {
    startTransition(async () => {
      const result = await deleteBackupAction(backupId);
      if (result.ok) {
        toast.success("Backup deleted", {
          description: result.data?.message || "Backup deleted successfully",
        });
      } else {
        toast.error("Delete failed", {
          description: result.error?.message || "Failed to delete backup",
        });
      }
    });
  }, []);

  const columns = React.useMemo<ColumnDef<BackupEntry>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatTimestamp(row.getValue("createdAt"))}
          </span>
        ),
        sortingFn: "datetime",
      },
      {
        accessorKey: "filename",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Filename" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm max-w-[200px] truncate block">
            {row.getValue("filename")}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          const config = getTypeBadgeConfig(type);
          return (
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "size",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Size" />
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatSize(row.getValue("size"))}
          </span>
        ),
        sortingFn: "basic",
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const config = getStatusBadgeConfig(status);
          const encrypted = row.original.encrypted;
          const storageProvider = row.original.storageProvider;

          return (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className={config.className}>
                {config.label}
              </Badge>
              {encrypted && (
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950">
                  <IconLock className="mr-1 size-3" />
                  AES-256
                </Badge>
              )}
              {storageProvider === "r2" && (
                <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950">
                  <IconCloud className="mr-1 size-3" />
                  R2
                </Badge>
              )}
              {storageProvider === "local" && (
                <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950">
                  <IconServer className="mr-1 size-3" />
                  Local
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("createdBy") || "System"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const backup = {
            id: row.original.id,
            name: row.original.filename,
            createdAt: row.original.createdAt,
            size: row.original.size,
            checksum: row.original.checksum,
          };
          const selectiveBackup = {
            id: row.original.id,
            name: row.original.filename,
            createdAt: row.original.createdAt,
            size: row.original.size,
            tables: ["orchestra_admin_config", "orchestra_audit_log", "orchestra_health_history", "orchestra_service_registry"],
          };
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const downloadUrl = routes.api.orchestra.backupDownload(row.original.id);
                  window.open(downloadUrl, "_blank");
                }}
                title="Download backup"
              >
                <IconDownload className="size-4" />
              </Button>
              <BackupVerification
                backup={backup}
                trigger={
                  <Button variant="ghost" size="sm" title="Verify backup integrity">
                    <IconShieldCheck className="size-4" />
                  </Button>
                }
              />
              <SelectiveRestore
                backup={selectiveBackup}
                trigger={
                  <Button variant="ghost" size="sm" title="Selective restore (choose tables)">
                    <IconReplace className="size-4" />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row.original.id)}
                disabled={isPending}
                title="Delete backup"
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleDelete, isPending]
  );

  if (backups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IconDatabase className="size-16 text-muted-foreground/30 mb-4" />
        <p className="text-sm font-medium">No backup history</p>
        <p className="text-sm text-muted-foreground">
          Create your first backup to protect your data
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={backups}
        enableColumnFilters
      />
    </div>
  );
}
