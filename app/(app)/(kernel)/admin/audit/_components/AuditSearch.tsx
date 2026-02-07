"use client";

/**
 * Audit Search Component
 * Search and filter audit log entries.
 */

import * as React from "react";
import { IconSearch, IconX, IconFilter } from "@tabler/icons-react";

import {
  Input,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@afenda/shadcn";

export interface AuditSearchProps {
  onSearch: (query: string) => void;
  onEventTypeFilter: (eventType: string | null) => void;
  onEntityTypeFilter: (entityType: string | null) => void;
  activeEventType: string | null;
  activeEntityType: string | null;
  resultCount: number;
  totalCount: number;
}

const EVENT_TYPES = [
  { value: "config.set", label: "Config Set" },
  { value: "config.changed", label: "Config Changed" },
  { value: "config.deleted", label: "Config Deleted" },
  { value: "service.registered", label: "Service Registered" },
  { value: "service.unregistered", label: "Service Unregistered" },
  { value: "backup.created", label: "Backup Created" },
  { value: "backup.restored", label: "Backup Restored" },
  { value: "system.error", label: "System Error" },
];

const ENTITY_TYPES = [
  { value: "config", label: "Configuration" },
  { value: "service", label: "Service" },
  { value: "backup", label: "Backup" },
  { value: "system", label: "System" },
];

export function AuditSearch({
  onSearch,
  onEventTypeFilter,
  onEntityTypeFilter,
  activeEventType,
  activeEntityType,
  resultCount,
  totalCount,
}: AuditSearchProps) {
  const [query, setQuery] = React.useState("");

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    onEventTypeFilter(null);
    onEntityTypeFilter(null);
  };

  const hasFilters = query.length > 0 || activeEventType !== null || activeEntityType !== null;
  const activeFilterCount = [activeEventType, activeEntityType].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-2">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
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

        {/* Filters popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="shrink-0 gap-2">
              <IconFilter className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="size-5 p-0 justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Event Type
                </p>
                <Select
                  value={activeEventType ?? "all"}
                  onValueChange={(v) => onEventTypeFilter(v === "all" ? null : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events</SelectItem>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Entity Type
                </p>
                <Select
                  value={activeEntityType ?? "all"}
                  onValueChange={(v) => onEntityTypeFilter(v === "all" ? null : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Results count and clear */}
      <div className="flex items-center gap-2 flex-wrap">
        {hasFilters && (
          <>
            <span className="text-sm text-muted-foreground">
              {resultCount} of {totalCount} entries
            </span>
            {activeEventType && (
              <Badge variant="outline" className="text-xs">
                {activeEventType}
              </Badge>
            )}
            {activeEntityType && (
              <Badge variant="outline" className="text-xs">
                {activeEntityType}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear all
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
