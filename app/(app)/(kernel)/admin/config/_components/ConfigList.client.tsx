"use client";

/**
 * Configuration List Component
 * Client-side searchable and filterable config table.
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

// Config row type matching server response
interface ConfigRow {
  key: string;
  value: unknown;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy: string | null;
}
import { ConfigSearch } from "./ConfigSearch";
import { ConfigEditDialog } from "./ConfigEditDialog";
import { ConfigEmptyState } from "./ConfigEmptyState";

export interface ConfigListClientProps {
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
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

/**
 * Format relative time.
 */
function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function ConfigListClient({ configs }: ConfigListClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [scopeFilter, setScopeFilter] = React.useState<string | null>(null);

  // Filter configs based on search and scope
  const filteredConfigs = React.useMemo(() => {
    let result = configs;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (config) =>
          config.key.toLowerCase().includes(query) ||
          (config.description?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filter by scope
    if (scopeFilter) {
      result = result.filter((config) => inferScope(config.key) === scopeFilter);
    }

    return result;
  }, [configs, searchQuery, scopeFilter]);

  if (configs.length === 0) {
    return <ConfigEmptyState />;
  }

  return (
    <div className="space-y-4">
      <ConfigSearch
        onSearch={setSearchQuery}
        onScopeFilter={setScopeFilter}
        activeScope={scopeFilter}
        resultCount={filteredConfigs.length}
        totalCount={configs.length}
      />

      {filteredConfigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No configurations match your search
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConfigs.map((config) => {
              const scope = inferScope(config.key);
              return (
                <TableRow key={config.key}>
                  <TableCell className="font-mono text-sm">
                    {config.key}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-sm">
                    {formatConfigValue(config.value)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getScopeVariant(scope)}>
                      {scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {config.updatedBy ?? "System"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(new Date(config.updatedAt))}
                  </TableCell>
                  <TableCell>
                    <ConfigEditDialog config={config} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
