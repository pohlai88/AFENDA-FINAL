"use client";

/**
 * Enhanced Service Registry Table with Advanced DataTable
 * Features: sorting, filtering, bulk operations, export (Excel, PDF, CSV)
 */

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  IconDownload,
  IconTrash,
  IconCircleCheckFilled,
  IconAlertTriangle,
  IconCircleXFilled,
  IconServer,
} from "@tabler/icons-react";

import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
  Checkbox,
  ClientAlertDialog,
  ClientAlertDialogAction,
  ClientAlertDialogCancel,
  ClientAlertDialogContent,
  ClientAlertDialogDescription,
  ClientAlertDialogFooter,
  ClientAlertDialogHeader,
  ClientAlertDialogTitle,
  ExcelExportButton,
  PDFExportButton,
} from "@afenda/shadcn";

export interface ServiceRegistryEntry {
  id: string;
  endpoint: string;
  status: "registered" | "healthy" | "degraded" | "unhealthy" | "unregistered";
  description: string | null;
  version: string | null;
  tags: string[] | null;
  lastHealthCheck: Date | string | null;
  registeredAt: Date | string;
  updatedAt: Date | string;
}

export interface ServiceRegistryTableEnhancedProps {
  services: ServiceRegistryEntry[];
  onUnregister?: (serviceIds: string[]) => Promise<void>;
}

/**
 * Get status badge configuration.
 */
function getStatusBadgeConfig(status: string): {
  icon: React.ReactNode;
  className: string;
  label: string;
} {
  switch (status) {
    case "healthy":
      return {
        icon: <IconCircleCheckFilled className="size-4" />,
        className: "text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950",
        label: "Healthy",
      };
    case "degraded":
      return {
        icon: <IconAlertTriangle className="size-4" />,
        className: "text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950",
        label: "Degraded",
      };
    case "unhealthy":
      return {
        icon: <IconCircleXFilled className="size-4" />,
        className: "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950",
        label: "Unhealthy",
      };
    case "registered":
      return {
        icon: <IconServer className="size-4" />,
        className: "text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950",
        label: "Registered",
      };
    case "unregistered":
      return {
        icon: <IconCircleXFilled className="size-4" />,
        className: "text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950",
        label: "Unregistered",
      };
    default:
      return {
        icon: <IconServer className="size-4" />,
        className: "text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950",
        label: "Unknown",
      };
  }
}

/**
 * Format relative time.
 */
function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

/**
 * Format timestamp.
 */
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

export function ServiceRegistryTableEnhanced({
  services,
  onUnregister,
}: ServiceRegistryTableEnhancedProps) {
  const [selectedRows, setSelectedRows] = React.useState<ServiceRegistryEntry[]>([]);
  const [isUnregistering, setIsUnregistering] = React.useState(false);
  const [showUnregisterDialog, setShowUnregisterDialog] = React.useState(false);

  // Define columns with sorting and filtering
  const columns = React.useMemo<ColumnDef<ServiceRegistryEntry>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Service ID" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.getValue("id")}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const config = getStatusBadgeConfig(status);
          return (
            <Badge variant="outline" className={config.className}>
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "endpoint",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Endpoint" />
        ),
        cell: ({ row }) => (
          <span className="text-sm max-w-[300px] truncate block">
            {row.getValue("endpoint")}
          </span>
        ),
      },
      {
        accessorKey: "version",
        header: "Version",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("version") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
            {row.getValue("description") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
          const tags = row.getValue("tags") as string[] | null;
          if (!tags || tags.length === 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="flex gap-1 flex-wrap max-w-[150px]">
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "lastHealthCheck",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Health Check" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(row.getValue("lastHealthCheck"))}
          </span>
        ),
        sortingFn: "datetime",
      },
      {
        accessorKey: "registeredAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Registered" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {formatTimestamp(row.getValue("registeredAt"))}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(row.getValue("registeredAt"))}
            </span>
          </div>
        ),
        sortingFn: "datetime",
      },
    ],
    []
  );

  const handleUnregisterConfirm = React.useCallback(async () => {
    if (!onUnregister || selectedRows.length === 0) return;

    setIsUnregistering(true);
    try {
      const serviceIds = selectedRows.map((s) => s.id);
      await onUnregister(serviceIds);
      setShowUnregisterDialog(false);
      setSelectedRows([]);
    } finally {
      setIsUnregistering(false);
    }
  }, [selectedRows, onUnregister]);

  const handleExport = React.useCallback(() => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : services;

    const csv = [
      ["Service ID", "Status", "Endpoint", "Version", "Description", "Tags", "Last Health Check", "Registered"].join(","),
      ...dataToExport.map((service) =>
        [
          service.id,
          service.status,
          service.endpoint,
          service.version || "",
          service.description || "",
          service.tags?.join("; ") || "",
          service.lastHealthCheck ? new Date(service.lastHealthCheck).toISOString() : "",
          new Date(service.registeredAt).toISOString(),
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service-registry-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedRows, services]);

  // Prepare export data - map to plain objects for export
  const sourceData = selectedRows.length > 0 ? selectedRows : services;
  const exportData = sourceData.map((service) => ({
    id: service.id,
    status: getStatusBadgeConfig(service.status).label,
    endpoint: service.endpoint,
    version: service.version || "",
    description: service.description || "",
    tags: service.tags?.join(", ") || "",
    lastHealthCheck: service.lastHealthCheck ? formatTimestamp(service.lastHealthCheck) : "—",
    registeredAt: formatTimestamp(service.registeredAt),
  }));

  const exportColumns = [
    { key: "id", header: "Service ID" },
    { key: "status", header: "Status" },
    { key: "endpoint", header: "Endpoint" },
    { key: "version", header: "Version" },
    { key: "description", header: "Description" },
    { key: "tags", header: "Tags" },
    { key: "lastHealthCheck", header: "Last Health Check" },
    { key: "registeredAt", header: "Registered" },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Export toolbar */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Bulk actions */}
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              {onUnregister && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnregisterDialog(true)}
                  className="h-8 text-red-600 hover:text-red-700"
                >
                  <IconTrash className="mr-2 size-4" />
                  Unregister ({selectedRows.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8"
              >
                <IconDownload className="mr-2 size-4" />
                CSV ({selectedRows.length})
              </Button>
            </div>
          )}

          {/* Right: Excel and PDF export */}
          <div className="flex items-center gap-2 ml-auto">
            <ExcelExportButton
              data={exportData}
              columns={exportColumns}
              options={{
                filename: `service-registry-${new Date().toISOString().split("T")[0]}.xlsx`,
                sheetName: "Service Registry",
              }}
            />

            <PDFExportButton
              data={exportData}
              columns={exportColumns}
              options={{
                filename: `service-registry-${new Date().toISOString().split("T")[0]}.pdf`,
                title: "Service Registry Report",
                subtitle: `Generated on ${new Date().toLocaleDateString()}`,
                orientation: "landscape",
                pageSize: "a4",
                headerColor: "#6366f1",
                alternateRowColor: "#f9fafb",
              }}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={services}
          enableRowSelection
          enableMultiRowSelection
          onRowSelectionChange={setSelectedRows}
          enableSorting
          enableColumnFilters
          pageSize={20}
          emptyState={
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconServer className="size-16 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No services registered</p>
              <p className="text-sm text-muted-foreground">
                Services will appear here once they register with the kernel
              </p>
            </div>
          }
        />
      </div>

      {/* Unregister Confirmation Dialog */}
      <ClientAlertDialog open={showUnregisterDialog} onOpenChange={setShowUnregisterDialog}>
        <ClientAlertDialogContent>
          <ClientAlertDialogHeader>
            <ClientAlertDialogTitle>Confirm Unregister Operation</ClientAlertDialogTitle>
            <ClientAlertDialogDescription>
              Are you sure you want to unregister {selectedRows.length} service{selectedRows.length > 1 ? "s" : ""}?
              This will remove the service{selectedRows.length > 1 ? "s" : ""} from the registry and stop health monitoring.
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  ⚠️ Warning: This action cannot be undone
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  Services will need to re-register to appear in the registry again.
                </p>
              </div>
            </ClientAlertDialogDescription>
          </ClientAlertDialogHeader>
          <ClientAlertDialogFooter>
            <ClientAlertDialogCancel disabled={isUnregistering}>Cancel</ClientAlertDialogCancel>
            <ClientAlertDialogAction
              onClick={handleUnregisterConfirm}
              disabled={isUnregistering}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUnregistering ? (
                <>
                  <IconServer className="mr-2 size-4 animate-spin" />
                  Unregistering...
                </>
              ) : (
                <>
                  <IconTrash className="mr-2 size-4" />
                  Unregister
                </>
              )}
            </ClientAlertDialogAction>
          </ClientAlertDialogFooter>
        </ClientAlertDialogContent>
      </ClientAlertDialog>
    </>
  );
}
