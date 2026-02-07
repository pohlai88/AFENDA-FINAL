"use client";

/**
 * Enhanced Audit Log Table with Advanced DataTable
 * Features: sorting, filtering, bulk operations, export (Excel, PDF, CSV, JSON)
 */

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { IconDownload, IconEye, IconFilter, IconSearch } from "@tabler/icons-react";

import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
  Checkbox,
  ExcelExportButton,
  PDFExportButton,
  Input,
} from "@afenda/shadcn";

import { AuditDetailModal, type AuditEntry } from "./AuditDetailModal";
import { useEnterpriseSearch, createSearchFields } from "../../../../_hooks/useEnterpriseSearch";

export interface AuditTableEnhancedProps {
  entries: AuditEntry[];
}

/**
 * Get event type badge configuration.
 */
function getEventBadgeConfig(eventType: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
} {
  if (eventType.includes("error") || eventType.includes("fail")) {
    return {
      variant: "outline",
      className: "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950",
    };
  }
  if (eventType.includes("create") || eventType.includes("success") || eventType.includes("set")) {
    return {
      variant: "outline",
      className: "text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950",
    };
  }
  if (eventType.includes("delete") || eventType.includes("remove")) {
    return {
      variant: "outline",
      className: "text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950",
    };
  }
  if (eventType.includes("update") || eventType.includes("change")) {
    return {
      variant: "outline",
      className: "text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950",
    };
  }
  return {
    variant: "outline",
    className: "text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950",
  };
}

/**
 * Format timestamp for display.
 */
function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative time.
 */
function formatRelativeTime(date: Date | string): string {
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

export function AuditTableEnhanced({ entries }: AuditTableEnhancedProps) {
  const [selectedRows, setSelectedRows] = React.useState<AuditEntry[]>([]);

  // Enterprise-grade search with advanced features
  const enterpriseSearch = useEnterpriseSearch(entries, {
    fields: createSearchFields.audit(),
    debounceMs: 300,
    cacheTTL: 5000,
    limit: 50,
    sortBy: 'relevance',
  });

  const filteredEntries = enterpriseSearch.items;

  // Define columns with sorting and filtering
  const columns = React.useMemo<ColumnDef<AuditEntry>[]>(
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
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Timestamp" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {formatTimestamp(row.getValue("createdAt"))}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(row.getValue("createdAt"))}
            </span>
          </div>
        ),
        sortingFn: "datetime",
      },
      {
        accessorKey: "eventType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Event Type" />
        ),
        cell: ({ row }) => {
          const eventType = row.getValue("eventType") as string;
          const config = getEventBadgeConfig(eventType);
          return (
            <Badge variant={config.variant} className={config.className}>
              {eventType.replace(".", " → ")}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "entityType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Entity Type" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("entityType") || "—"}
          </span>
        ),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "id",
        header: "Entry ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground" title={row.getValue("id") as string}>
            {(row.getValue("id") as string)?.slice(0, 8) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "entityId",
        header: "Target Entity",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground max-w-[150px] truncate block" title={row.getValue("entityId") as string}>
            {row.getValue("entityId") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "actorId",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Actor" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("actorId") || "System"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <AuditDetailModal entry={entry}>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="View audit details"
              >
                <IconEye className="size-4" />
              </Button>
            </AuditDetailModal>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  const handleExport = React.useCallback(() => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : filteredEntries;

    // Create CSV with all fields
    const csv = [
      ["Timestamp", "Event Type", "Entity Type", "Entry ID", "Target Entity", "Actor", "Details"].join(","),
      ...dataToExport.map((entry: AuditEntry) =>
        [
          new Date(entry.createdAt).toISOString(),
          entry.eventType,
          entry.entityType || "",
          entry.id,
          entry.entityId || "",
          entry.actorId || "System",
          entry.details ? JSON.stringify(entry.details) : "",
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedRows, filteredEntries]);

  const handleExportJSON = React.useCallback(() => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : filteredEntries;

    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedRows, filteredEntries]);

  // Excel/PDF export data
  const excelExportData = filteredEntries.map((entry: AuditEntry) => ({
    createdAt: new Date(entry.createdAt).toLocaleString(),
    eventType: entry.eventType,
    entityType: entry.entityType || "",
    entryId: entry.id,
    entityId: entry.entityId || "",
    actorId: entry.actorId || "System",
  }));

  const exportColumns = [
    { key: "createdAt", header: "Timestamp" },
    { key: "eventType", header: "Event Type" },
    { key: "entityType", header: "Entity Type" },
    { key: "entryId", header: "Entry ID" },
    { key: "entityId", header: "Target Entity" },
    { key: "actorId", header: "Actor" },
  ];

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search audit entries..."
            value={enterpriseSearch.query}
            onChange={(e) => enterpriseSearch.search(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
        {enterpriseSearch.query && (
          <div className="text-sm text-muted-foreground">
            {enterpriseSearch.total} results{enterpriseSearch.searchTime > 0 && ` (${enterpriseSearch.searchTime}ms)`}
          </div>
        )}
      </div>

      {/* Export buttons */}
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
          </>
        )}

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
          data={excelExportData}
          columns={exportColumns}
          options={{
            filename: `audit-log-${new Date().toISOString().split("T")[0]}.xlsx`,
            sheetName: "Audit Log",
          }}
        />

        <PDFExportButton
          data={excelExportData}
          columns={exportColumns}
          options={{
            filename: `audit-log-${new Date().toISOString().split("T")[0]}.pdf`,
            title: "Audit Log Report",
            subtitle: `Generated on ${new Date().toLocaleDateString()}`,
            orientation: "landscape",
            pageSize: "a4",
            headerColor: "#3b82f6",
            alternateRowColor: "#f9fafb",
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredEntries}
        enableRowSelection
        enableMultiRowSelection
        onRowSelectionChange={setSelectedRows}
        enableSorting
        enableColumnFilters
        pageSize={20}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconFilter className="size-16 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium">
              {enterpriseSearch.query ? "No matching audit entries found" : "No audit entries found"}
            </p>
            <p className="text-sm text-muted-foreground">
              {enterpriseSearch.query
                ? `Try adjusting your search terms or clear the search to see all entries`
                : "Audit entries will appear here once system events occur"
              }
            </p>
            {enterpriseSearch.error && (
              <p className="text-xs text-red-500 mt-2">
                Search error: {enterpriseSearch.error}
              </p>
            )}
          </div>
        }
      />
    </div >
  );
}
