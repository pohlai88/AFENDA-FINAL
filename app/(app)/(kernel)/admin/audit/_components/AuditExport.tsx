"use client";

/**
 * Audit Export Component
 * Export audit logs to CSV or JSON with full metadata and filtering.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Button,
  Card,
  CardContent,
  Label,
  Checkbox,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";
import { toast } from "sonner";

interface AuditEvent {
  id: string;
  action: string;
  resource: string;
  userId: string;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
}

interface AuditExportProps {
  events: AuditEvent[];
  trigger?: React.ReactNode;
}

type ExportFormat = "csv" | "json";

interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeUserAgent: boolean;
  includeIpAddress: boolean;
  dateRange: "all" | "today" | "week" | "month";
}

/**
 * Convert events to CSV format.
 */
function eventsToCSV(events: AuditEvent[], options: ExportOptions): string {
  const headers = [
    "ID",
    "Timestamp",
    "Action",
    "Resource",
    "User ID",
    "Status",
  ];

  if (options.includeIpAddress) headers.push("IP Address");
  if (options.includeUserAgent) headers.push("User Agent");
  if (options.includeMetadata) headers.push("Metadata");

  const rows = events.map((event) => {
    const row = [
      event.id,
      typeof event.timestamp === "string" ? event.timestamp : event.timestamp.toISOString(),
      event.action,
      event.resource,
      event.userId,
      event.status || "success",
    ];

    if (options.includeIpAddress) row.push(event.ipAddress || "");
    if (options.includeUserAgent) row.push(event.userAgent || "");
    if (options.includeMetadata) {
      row.push(event.metadata ? JSON.stringify(event.metadata) : "");
    }

    return row;
  });

  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Convert events to JSON format.
 */
function eventsToJSON(events: AuditEvent[], options: ExportOptions): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalEvents: events.length,
    format: "audit-log-export-v1",
    options: {
      includeMetadata: options.includeMetadata,
      includeUserAgent: options.includeUserAgent,
      includeIpAddress: options.includeIpAddress,
      dateRange: options.dateRange,
    },
    events: events.map((event) => {
      const exportEvent: Record<string, unknown> = {
        id: event.id,
        timestamp: typeof event.timestamp === "string" ? event.timestamp : event.timestamp.toISOString(),
        action: event.action,
        resource: event.resource,
        userId: event.userId,
        status: event.status || "success",
      };

      if (options.includeIpAddress && event.ipAddress) {
        exportEvent.ipAddress = event.ipAddress;
      }
      if (options.includeUserAgent && event.userAgent) {
        exportEvent.userAgent = event.userAgent;
      }
      if (options.includeMetadata && event.metadata) {
        exportEvent.metadata = event.metadata;
      }

      return exportEvent;
    }),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Filter events by date range.
 */
function filterEventsByDateRange(events: AuditEvent[], range: ExportOptions["dateRange"]): AuditEvent[] {
  if (range === "all") return events;

  const now = new Date();
  const cutoff = new Date();

  switch (range) {
    case "today":
      cutoff.setHours(0, 0, 0, 0);
      break;
    case "week":
      cutoff.setDate(now.getDate() - 7);
      break;
    case "month":
      cutoff.setMonth(now.getMonth() - 1);
      break;
  }

  return events.filter((event) => {
    const eventDate = typeof event.timestamp === "string" ? new Date(event.timestamp) : event.timestamp;
    return eventDate >= cutoff;
  });
}

export function AuditExport({ events, trigger }: AuditExportProps) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ExportOptions>({
    format: "json",
    includeMetadata: true,
    includeUserAgent: false,
    includeIpAddress: false,
    dateRange: "all",
  });

  const filteredEvents = React.useMemo(
    () => filterEventsByDateRange(events, options.dateRange),
    [events, options.dateRange]
  );

  const handleExport = () => {
    if (filteredEvents.length === 0) {
      toast.error("No events to export");
      return;
    }

    const content = options.format === "csv"
      ? eventsToCSV(filteredEvents, options)
      : eventsToJSON(filteredEvents, options);

    const blob = new Blob([content], {
      type: options.format === "csv" ? "text/csv" : "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${options.dateRange}-${new Date().toISOString().split("T")[0]}.${options.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredEvents.length} events as ${options.format.toUpperCase()}`);
    setOpen(false);
  };

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            Export
          </Button>
        )}
      </ClientDialogTrigger>
      <ClientDialogContent className="max-w-2xl">
        <ClientDialogHeader>
          <ClientDialogTitle>Export Audit Logs</ClientDialogTitle>
          <ClientDialogDescription>
            Export audit events to CSV or JSON with customizable options
          </ClientDialogDescription>
        </ClientDialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <ClientSelect
              value={options.format}
              onValueChange={(value: string) => setOptions({ ...options, format: value as ExportFormat })}
            >
              <ClientSelectTrigger>
                <ClientSelectValue />
              </ClientSelectTrigger>
              <ClientSelectContent>
                <ClientSelectItem value="json">JSON (Structured)</ClientSelectItem>
                <ClientSelectItem value="csv">CSV (Spreadsheet)</ClientSelectItem>
              </ClientSelectContent>
            </ClientSelect>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <ClientSelect
              value={options.dateRange}
              onValueChange={(value: string) => setOptions({ ...options, dateRange: value as ExportOptions["dateRange"] })}
            >
              <ClientSelectTrigger>
                <ClientSelectValue />
              </ClientSelectTrigger>
              <ClientSelectContent>
                <ClientSelectItem value="all">All Events</ClientSelectItem>
                <ClientSelectItem value="today">Today</ClientSelectItem>
                <ClientSelectItem value="week">Last 7 Days</ClientSelectItem>
                <ClientSelectItem value="month">Last 30 Days</ClientSelectItem>
              </ClientSelectContent>
            </ClientSelect>
          </div>

          {/* Include Options */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Label className="text-base">Include in Export</Label>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="metadata"
                    checked={options.includeMetadata}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeMetadata: checked === true })
                    }
                  />
                  <Label htmlFor="metadata" className="cursor-pointer font-normal">
                    Event Metadata (additional context)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ipAddress"
                    checked={options.includeIpAddress}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeIpAddress: checked === true })
                    }
                  />
                  <Label htmlFor="ipAddress" className="cursor-pointer font-normal">
                    IP Address
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="userAgent"
                    checked={options.includeUserAgent}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeUserAgent: checked === true })
                    }
                  />
                  <Label htmlFor="userAgent" className="cursor-pointer font-normal">
                    User Agent (browser/client info)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Info */}
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Export Preview</div>
                <div className="text-sm">
                  {filteredEvents.length} events will be exported as {options.format.toUpperCase()}
                </div>
                {options.dateRange !== "all" && (
                  <div className="text-xs text-muted-foreground">
                    Filtered by: {options.dateRange}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={filteredEvents.length === 0}>
            Export {filteredEvents.length} Events
          </Button>
        </div>
      </ClientDialogContent>
    </ClientDialog>
  );
}
