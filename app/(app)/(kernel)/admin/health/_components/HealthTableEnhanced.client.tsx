"use client";

/**
 * Enhanced Health Monitoring Table with Advanced DataTable
 * Features: sorting, filtering by status, bulk operations
 */

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  IconCircleCheckFilled,
  IconAlertTriangle,
  IconCircleXFilled,
  IconRefresh,
  IconDownload,
} from "@tabler/icons-react";

import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
  Checkbox,
  ExcelExportButton,
  PDFExportButton,
} from "@afenda/shadcn";

export interface ServiceHealth {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  lastCheck: Date | string;
  latency?: number;
  errorMessage?: string | null;
  uptime?: number;
}

export interface HealthTableEnhancedProps {
  services: ServiceHealth[];
  onRefresh?: (serviceIds: string[]) => Promise<void>;
}

/**
 * Get status badge configuration.
 */
function getStatusConfig(status: string): {
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
    default:
      return {
        icon: <IconAlertTriangle className="size-4" />,
        className: "text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950",
        label: "Unknown",
      };
  }
}

/**
 * Format uptime percentage.
 */
function formatUptime(uptime?: number): string {
  if (uptime === undefined) return "—";
  return `${(uptime * 100).toFixed(2)}%`;
}

/**
 * Format latency.
 */
function formatLatency(latency?: number): string {
  if (latency === undefined) return "—";
  if (latency < 100) return `${latency}ms`;
  if (latency < 1000) return `${latency}ms`;
  return `${(latency / 1000).toFixed(2)}s`;
}

/**
 * Format relative time.
 */
function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  return d.toLocaleTimeString();
}

export function HealthTableEnhanced({ services, onRefresh }: HealthTableEnhancedProps) {
  const [selectedRows, setSelectedRows] = React.useState<ServiceHealth[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Define columns with sorting and filtering
  const columns = React.useMemo<ColumnDef<ServiceHealth>[]>(
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
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const config = getStatusConfig(status);
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
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Service Name" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "latency",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Latency" />
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatLatency(row.getValue("latency"))}
          </span>
        ),
        sortingFn: "basic",
      },
      {
        accessorKey: "uptime",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Uptime" />
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatUptime(row.getValue("uptime"))}
          </span>
        ),
        sortingFn: "basic",
      },
      {
        accessorKey: "lastCheck",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Check" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(row.getValue("lastCheck"))}
          </span>
        ),
        sortingFn: "datetime",
      },
      {
        accessorKey: "errorMessage",
        header: "Error",
        cell: ({ row }) => {
          const error = row.getValue("errorMessage") as string | null;
          if (!error) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="text-sm text-red-600 dark:text-red-400 max-w-[200px] truncate block">
              {error}
            </span>
          );
        },
      },
    ],
    []
  );

  const handleRefreshSelected = React.useCallback(async () => {
    if (!onRefresh || selectedRows.length === 0) return;

    setIsRefreshing(true);
    try {
      const serviceIds = selectedRows.map((s) => s.id);
      await onRefresh(serviceIds);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedRows, onRefresh]);

  const handleExport = React.useCallback(() => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : services;

    const csv = [
      ["Service Name", "Status", "Latency (ms)", "Uptime (%)", "Last Check", "Error"].join(","),
      ...dataToExport.map((service) =>
        [
          service.name,
          service.status,
          service.latency?.toString() || "",
          service.uptime ? (service.uptime * 100).toFixed(2) : "",
          new Date(service.lastCheck).toISOString(),
          service.errorMessage || "",
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-status-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedRows, services]);

  // Prepare export data - map to plain objects for export
  const sourceData = selectedRows.length > 0 ? selectedRows : services;
  const exportData = sourceData.map((service) => ({
    name: service.name,
    status: service.status,
    latency: service.latency?.toString() || "",
    uptime: service.uptime ? `${(service.uptime * 100).toFixed(2)}%` : "",
    lastCheck: new Date(service.lastCheck).toLocaleString(),
    errorMessage: service.errorMessage || "",
  }));

  const exportColumns = [
    { key: "name", header: "Service Name" },
    { key: "status", header: "Status" },
    { key: "latency", header: "Latency (ms)" },
    { key: "uptime", header: "Uptime" },
    { key: "lastCheck", header: "Last Check" },
    { key: "errorMessage", header: "Error" },
  ];

  return (
    <div className="space-y-4">
      {/* Export toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Bulk actions */}
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshSelected}
                disabled={isRefreshing}
                className="h-8"
              >
                <IconRefresh className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh ({selectedRows.length})
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
              filename: `health-status-${new Date().toISOString().split("T")[0]}.xlsx`,
              sheetName: "Health Status",
            }}
          />

          <PDFExportButton
            data={exportData}
            columns={exportColumns}
            options={{
              filename: `health-status-${new Date().toISOString().split("T")[0]}.pdf`,
              title: "Service Health Status Report",
              subtitle: `Generated on ${new Date().toLocaleDateString()}`,
              orientation: "landscape",
              pageSize: "a4",
              headerColor: "#10b981",
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
            <IconCircleCheckFilled className="size-16 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium">No services registered</p>
            <p className="text-sm text-muted-foreground">
              Services will appear here once registered with the system
            </p>
          </div>
        }
      />
    </div>
  );
}
