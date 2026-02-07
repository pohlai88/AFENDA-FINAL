"use client";

/**
 * Config Diff Viewer
 * Visual diff comparison for configuration changes (before/after).
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@afenda/shadcn";

interface ConfigDiff {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp?: Date | string;
  changedBy?: string;
}

interface ConfigDiffViewerProps {
  diff: ConfigDiff;
  showMetadata?: boolean;
}

/**
 * Format value for display with proper JSON formatting.
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}

/**
 * Detect change type.
 */
function getChangeType(oldValue: unknown, newValue: unknown): "added" | "removed" | "modified" {
  if (oldValue === null || oldValue === undefined) return "added";
  if (newValue === null || newValue === undefined) return "removed";
  return "modified";
}

/**
 * Format timestamp for display.
 */
function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleString();
}

export function ConfigDiffViewer({ diff, showMetadata = true }: ConfigDiffViewerProps) {
  const changeType = getChangeType(diff.oldValue, diff.newValue);
  const oldValueStr = formatValue(diff.oldValue);
  const newValueStr = formatValue(diff.newValue);

  // Determine if values are multiline (JSON objects/arrays)
  const isMultiline = oldValueStr.includes("\n") || newValueStr.includes("\n");

  return (
    <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-mono">{diff.key}</CardTitle>
          <Badge
            variant="outline"
            className={
              changeType === "added"
                ? "border-green-500 text-green-700 bg-green-50 dark:bg-green-950"
                : changeType === "removed"
                ? "border-red-500 text-red-700 bg-red-50 dark:bg-red-950"
                : "border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-950"
            }
          >
            {changeType === "added" ? "Added" : changeType === "removed" ? "Removed" : "Modified"}
          </Badge>
        </div>
        {showMetadata && (diff.timestamp || diff.changedBy) && (
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            {diff.timestamp && <div>Changed: {formatTimestamp(diff.timestamp)}</div>}
            {diff.changedBy && <div>By: {diff.changedBy}</div>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isMultiline ? (
          // Side-by-side diff for multiline values
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <span className="text-red-500">−</span> Before
              </div>
              <pre className="text-xs font-mono p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900 overflow-x-auto">
                {oldValueStr}
              </pre>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <span className="text-green-500">+</span> After
              </div>
              <pre className="text-xs font-mono p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900 overflow-x-auto">
                {newValueStr}
              </pre>
            </div>
          </div>
        ) : (
          // Inline diff for single-line values
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-red-500 shrink-0">−</span>
              <span className="px-2 py-1 rounded bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900 line-through">
                {oldValueStr}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-green-500 shrink-0">+</span>
              <span className="px-2 py-1 rounded bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900">
                {newValueStr}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Multiple diffs viewer for batch changes.
 */
interface ConfigDiffListProps {
  diffs: ConfigDiff[];
  title?: string;
}

export function ConfigDiffList({ diffs, title = "Configuration Changes" }: ConfigDiffListProps) {
  if (diffs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No changes to display
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {title}
          <Badge variant="secondary">{diffs.length} changes</Badge>
        </h3>
      )}
      <div className="space-y-3">
        {diffs.map((diff, index) => (
          <ConfigDiffViewer key={`${diff.key}-${index}`} diff={diff} showMetadata={index === 0} />
        ))}
      </div>
    </div>
  );
}
