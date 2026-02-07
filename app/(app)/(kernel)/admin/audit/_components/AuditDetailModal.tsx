"use client";

/**
 * Audit Detail Modal
 * Display full audit event details in a modal.
 */

import * as React from "react";
import { IconEye, IconCopy, IconCheck } from "@tabler/icons-react";

import {
  Button,
  Badge,
  Separator,
  ClientDialog,
  ClientDialogTrigger,
  ClientDialogContent,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogDescription,
} from "@afenda/shadcn";

export interface AuditEntry {
  id: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  actorId: string | null;
  actorType: string | null;
  details: Record<string, unknown> | null;
  previousValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date | string;
  traceId?: string | null;
}

export interface AuditDetailModalProps {
  entry: AuditEntry;
  children?: React.ReactNode;
}

/**
 * Get event type badge variant based on event type.
 */
function getEventBadgeClass(eventType: string): string {
  if (eventType.includes("error") || eventType.includes("fail")) {
    return "text-red-600 border-red-200 bg-red-50";
  }
  if (eventType.includes("create") || eventType.includes("success")) {
    return "text-green-600 border-green-200 bg-green-50";
  }
  if (eventType.includes("delete") || eventType.includes("remove")) {
    return "text-orange-600 border-orange-200 bg-orange-50";
  }
  if (eventType.includes("update") || eventType.includes("change")) {
    return "text-blue-600 border-blue-200 bg-blue-50";
  }
  return "text-gray-600 border-gray-200 bg-gray-50";
}

/**
 * Format timestamp for display.
 */
function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

export function AuditDetailModal({ entry, children }: AuditDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const text = JSON.stringify(entry, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const detailsString = entry.details
    ? JSON.stringify(entry.details, null, 2)
    : "No additional details";

  return (
    <ClientDialog>
      <ClientDialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <IconEye className="size-4" />
            <span className="sr-only">View details</span>
          </Button>
        )}
      </ClientDialogTrigger>
      <ClientDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <ClientDialogHeader>
          <ClientDialogTitle className="flex items-center gap-2">
            Audit Event Details
            <Badge variant="outline" className={getEventBadgeClass(entry.eventType)}>
              {entry.eventType.replace(".", " → ")}
            </Badge>
          </ClientDialogTitle>
          <ClientDialogDescription>
            Event ID: {entry.id}
          </ClientDialogDescription>
        </ClientDialogHeader>

        <div className="space-y-4 mt-4">
          {/* Event Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Event Type
              </p>
              <p className="font-mono text-sm mt-1">{entry.eventType}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Timestamp
              </p>
              <p className="text-sm mt-1">{formatTimestamp(entry.createdAt)}</p>
            </div>
          </div>

          <Separator />

          {/* Entity Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Entity Type
              </p>
              <p className="text-sm mt-1">{entry.entityType ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Entity ID
              </p>
              <p className="font-mono text-sm mt-1">{entry.entityId ?? "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Actor
            </p>
            <p className="text-sm mt-1">{entry.actorId ?? "System"}</p>
          </div>

          <Separator />

          {/* Metadata */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Metadata
              </p>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <IconCheck className="size-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <IconCopy className="size-3 mr-1" />
                    Copy JSON
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {detailsString}
            </pre>
          </div>
        </div>
      </ClientDialogContent>
    </ClientDialog>
  );
}
