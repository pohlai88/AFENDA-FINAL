"use client";

/**
 * Config History Timeline
 * Visual timeline of configuration changes using orchestra_config_history.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@afenda/shadcn";
import { ConfigDiffViewer } from "./ConfigDiffViewer";

interface ConfigHistoryEntry {
  id: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string;
  changedAt: Date | string;
  operation: "create" | "update" | "delete";
}

interface ConfigHistoryTimelineProps {
  entries: ConfigHistoryEntry[];
  configKey?: string;
}

/**
 * Format relative time.
 */
function formatRelativeTime(date: Date | string): string {
  const timestamp = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - timestamp.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return timestamp.toLocaleDateString();
}

/**
 * Get operation badge using shadcn variants.
 */
function getOperationBadge(operation: string) {
  switch (operation) {
    case "create":
      return <Badge variant="default">Created</Badge>;
    case "update":
      return <Badge variant="secondary">Updated</Badge>;
    case "delete":
      return <Badge variant="destructive">Deleted</Badge>;
    default:
      return <Badge variant="outline">{operation}</Badge>;
  }
}

export function ConfigHistoryTimeline({ entries, configKey }: ConfigHistoryTimelineProps) {
  const [expandedEntries, setExpandedEntries] = React.useState<Set<string>>(new Set());

  const toggleEntry = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No history available{configKey ? ` for ${configKey}` : ""}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Change History
          {configKey && <code className="text-sm font-mono text-muted-foreground">{configKey}</code>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline entries */}
          <div className="space-y-6">
            {entries.map((entry, index) => {
              const isExpanded = expandedEntries.has(entry.id);
              const isLast = index === entries.length - 1;

              return (
                <div key={entry.id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2.5 top-2 size-3 rounded-full border-2 ${
                      entry.operation === "create"
                        ? "bg-primary border-primary"
                        : entry.operation === "delete"
                        ? "bg-destructive border-destructive"
                        : "bg-secondary border-secondary"
                    }`}
                  />

                  {/* Entry content */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getOperationBadge(entry.operation)}
                          <span className="text-sm text-muted-foreground">
                            by {entry.changedBy}
                          </span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(entry.changedAt)}
                          </span>
                        </div>
                        {!configKey && (
                          <code className="text-sm font-mono text-foreground mt-1 block">
                            {entry.key}
                          </code>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEntry(entry.id)}
                      >
                        {isExpanded ? "Hide" : "Show"} Changes
                      </Button>
                    </div>

                    {/* Diff viewer */}
                    {isExpanded && (
                      <div className="mt-3">
                        <ConfigDiffViewer
                          diff={{
                            key: entry.key,
                            oldValue: entry.oldValue,
                            newValue: entry.newValue,
                          }}
                          showMetadata={false}
                        />
                      </div>
                    )}
                  </div>

                  {/* Connector to next entry */}
                  {!isLast && <div className="h-4" />}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
