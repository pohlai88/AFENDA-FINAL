"use client";

/**
 * Enhanced Configuration List with Advanced DataTable
 * Features: sorting, filtering, bulk operations, export
 */

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { IconTrash, IconDownload } from "@tabler/icons-react";

import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
  Checkbox,
  ExcelExportButton,
  PDFExportButton,
} from "@afenda/shadcn";

import { ConfigEditDialogEnhanced } from "./ConfigEditDialog.enhanced";

// Config row type matching server response
interface ConfigRow {
  key: string;
  value: unknown;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy: string | null;
}

export interface ConfigListEnhancedProps {
  configs: ConfigRow[];
}

/**
 * Infer scope from config key pattern.
 */
function inferScope(key: string): string {
  if (key.startsWith("global.")) return "global";
  if (key.startsWith("tenant.")) return "tenant";
  if (key.startsWith("service.")) return "service";
  return "global";
}

/**
 * Get scope badge variant using shadcn's built-in variants.
 */
function getScopeVariant(scope: string): "default" | "secondary" | "outline" {
  switch (scope) {
    case "global":
      return "default";
    case "tenant":
      return "secondary";
    case "service":
      return "outline";
    default:
      return "default";
  }
}

/**
 * Format config value for display.
 */
function formatConfigValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

/**
 * Format relative time.
 */
function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - dateObj.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return dateObj.toLocaleDateString();
}

export function ConfigListEnhanced({ configs }: ConfigListEnhancedProps) {
  const [selectedRows, setSelectedRows] = React.useState<ConfigRow[]>([]);

  // Define columns with sorting and filtering
  const columns = React.useMemo<ColumnDef<ConfigRow>[]>(
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
        accessorKey: "key",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Key" />
        ),
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.getValue("key")}</div>
        ),
      },
      {
        accessorKey: "value",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Value" />
        ),
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate font-mono text-sm">
            {formatConfigValue(row.getValue("value"))}
          </div>
        ),
      },
      {
        id: "scope",
        accessorFn: (row) => inferScope(row.key),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Scope" />
        ),
        cell: ({ row }) => {
          const scope = row.getValue("scope") as string;
          return (
            <Badge variant={getScopeVariant(scope)}>
              {scope.charAt(0).toUpperCase() + scope.slice(1)}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "updatedBy",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated By" />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {row.getValue("updatedBy") || "System"}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {formatRelativeTime(row.getValue("updatedAt"))}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const config = row.original;
          return (
            <div className="flex items-center gap-2">
              <ConfigEditDialogEnhanced config={config} />
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Delete configuration"
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const handleExport = React.useCallback(() => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : configs;
    const csv = [
      ["Key", "Value", "Scope", "Description", "Updated By", "Updated At"].join(","),
      ...dataToExport.map((config) =>
        [
          config.key,
          formatConfigValue(config.value),
          inferScope(config.key),
          config.description || "",
          config.updatedBy || "System",
          new Date(config.updatedAt).toISOString(),
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `configs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedRows, configs]);

  const handleExportJSON = React.useCallback(() => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : configs;
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `configs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedRows, configs]);

  // Prepare export data
  const sourceData = selectedRows.length > 0 ? selectedRows : configs;
  const exportData = sourceData.map((config) => ({
    key: config.key,
    value: formatConfigValue(config.value),
    scope: inferScope(config.key),
    description: config.description || "",
    updatedBy: config.updatedBy || "System",
    updatedAt: new Date(config.updatedAt).toLocaleString(),
  }));

  const exportColumns = [
    { key: "key", header: "Key" },
    { key: "value", header: "Value" },
    { key: "scope", header: "Scope" },
    { key: "description", header: "Description" },
    { key: "updatedBy", header: "Updated By" },
    { key: "updatedAt", header: "Updated" },
  ];

  return (
    <div className="space-y-4">
      {/* Export and bulk actions toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8"
              >
                <IconDownload className="mr-2 size-4" />
                CSV ({selectedRows.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                className="h-8"
              >
                <IconDownload className="mr-2 size-4" />
                JSON ({selectedRows.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
              >
                <IconTrash className="mr-2 size-4" />
                Delete ({selectedRows.length})
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8"
          >
            <IconDownload className="mr-2 size-4" />
            CSV
          </Button>

          <ExcelExportButton
            data={exportData}
            columns={exportColumns}
            options={{
              filename: `configs-${new Date().toISOString().split("T")[0]}.xlsx`,
              sheetName: "Configurations",
            }}
          />

          <PDFExportButton
            data={exportData}
            columns={exportColumns}
            options={{
              filename: `configs-${new Date().toISOString().split("T")[0]}.pdf`,
              title: "Configuration Report",
              subtitle: `Generated on ${new Date().toLocaleDateString()}`,
              orientation: "landscape",
              pageSize: "a4",
              headerColor: "#3b82f6",
              alternateRowColor: "#f9fafb",
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={configs}
        enableRowSelection
        enableMultiRowSelection
        onRowSelectionChange={setSelectedRows}
        pageSize={20}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No configurations found. Create your first configuration to get started.
            </p>
          </div>
        }
      />
    </div>
  );
}
