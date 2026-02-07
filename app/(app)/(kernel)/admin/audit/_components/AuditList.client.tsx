"use client";

/**
 * Audit List Component
 * Client-side searchable and filterable audit log.
 */

import * as React from "react";

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@afenda/shadcn";

import { AuditSearch } from "./AuditSearch";
import { AuditDetailModal, type AuditEntry } from "./AuditDetailModal";

export interface AuditListClientProps {
  entries: AuditEntry[];
}

/**
 * Get event type badge class.
 */
function getEventBadgeClass(eventType: string): string {
  if (eventType.includes("error") || eventType.includes("fail")) {
    return "text-red-600 border-red-200 bg-red-50";
  }
  if (eventType.includes("create") || eventType.includes("success") || eventType.includes("set")) {
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

export function AuditListClient({ entries }: AuditListClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [eventTypeFilter, setEventTypeFilter] = React.useState<string | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = React.useState<string | null>(null);

  // Filter entries based on search and filters
  const filteredEntries = React.useMemo(() => {
    let result = entries;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.eventType.toLowerCase().includes(query) ||
          entry.entityType?.toLowerCase().includes(query) ||
          entry.entityId?.toLowerCase().includes(query) ||
          entry.actorId?.toLowerCase().includes(query)
      );
    }

    // Filter by event type
    if (eventTypeFilter) {
      result = result.filter((entry) => entry.eventType === eventTypeFilter);
    }

    // Filter by entity type
    if (entityTypeFilter) {
      result = result.filter((entry) => entry.entityType === entityTypeFilter);
    }

    return result;
  }, [entries, searchQuery, eventTypeFilter, entityTypeFilter]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No audit entries yet. System events will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AuditSearch
        onSearch={setSearchQuery}
        onEventTypeFilter={setEventTypeFilter}
        onEntityTypeFilter={setEntityTypeFilter}
        activeEventType={eventTypeFilter}
        activeEntityType={entityTypeFilter}
        resultCount={filteredEntries.length}
        totalCount={entries.length}
      />

      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No audit entries match your filters
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="w-[80px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Badge variant="outline" className={getEventBadgeClass(entry.eventType)}>
                    {entry.eventType.replace(".", " → ")}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {entry.entityType && entry.entityId ? (
                    <span>
                      {entry.entityType}:{" "}
                      <span className="text-muted-foreground truncate max-w-[150px] inline-block align-bottom">
                        {entry.entityId}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entry.actorId ?? "System"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRelativeTime(entry.createdAt)}
                </TableCell>
                <TableCell>
                  <AuditDetailModal entry={entry} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
