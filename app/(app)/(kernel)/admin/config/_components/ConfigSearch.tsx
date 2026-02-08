"use client";

/**
 * Configuration Search Component
 * Client-side search and filtering for configurations.
 */

import * as React from "react";
import { IconSearch, IconX, IconFilter } from "@tabler/icons-react";

import {
  Input,
  Button,
  Badge,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
} from "@afenda/shadcn";

export interface ConfigSearchProps {
  onSearch: (query: string) => void;
  onScopeFilter: (scope: string | null) => void;
  activeScope: string | null;
  resultCount: number;
  totalCount: number;
}

const SCOPES = [
  { value: "global", label: "Global" },
  { value: "tenant", label: "Tenant" },
  { value: "service", label: "Service" },
];

export function ConfigSearch({
  onSearch,
  onScopeFilter,
  activeScope,
  resultCount,
  totalCount,
}: ConfigSearchProps) {
  const [query, setQuery] = React.useState("");

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    onScopeFilter(null);
  };

  const hasFilters = query.length > 0 || activeScope !== null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-2">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by key..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
              onClick={() => handleQueryChange("")}
            >
              <IconX className="size-3" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        {/* Scope filter */}
        <ClientPopover>
          <ClientPopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <IconFilter className="size-4" />
              {activeScope && (
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
              )}
              <span className="sr-only">Filter by scope</span>
            </Button>
          </ClientPopoverTrigger>
          <ClientPopoverContent align="start" className="w-48 p-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                Filter by Scope
              </p>
              <ClientSelect
                value={activeScope ?? "all"}
                onValueChange={(v) => onScopeFilter(v === "all" ? null : v)}
              >
                <ClientSelectTrigger className="w-full">
                  <ClientSelectValue placeholder="All scopes" />
                </ClientSelectTrigger>
                <ClientSelectContent>
                  <ClientSelectItem value="all">All scopes</ClientSelectItem>
                  {SCOPES.map((scope) => (
                    <ClientSelectItem key={scope.value} value={scope.value}>
                      {scope.label}
                    </ClientSelectItem>
                  ))}
                </ClientSelectContent>
              </ClientSelect>
            </div>
          </ClientPopoverContent>
        </ClientPopover>
      </div>

      {/* Results count and clear */}
      <div className="flex items-center gap-2">
        {hasFilters && (
          <>
            <span className="text-sm text-muted-foreground">
              {resultCount} of {totalCount} results
            </span>
            {activeScope && (
              <Badge variant="outline" className="capitalize">
                {activeScope}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear filters
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
