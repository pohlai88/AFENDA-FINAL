"use client";

/**
 * Service Filter Component
 * Filters health dashboard by status, name, and tags.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { IconFilter, IconX } from "@tabler/icons-react";
import {
  Button,
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
  Badge,
  Input,
  Label,
  Checkbox,
} from "@afenda/shadcn";

export interface ServiceFilterState {
  status: ("healthy" | "degraded" | "down")[];
  searchQuery: string;
  tags: string[];
}

interface ServiceFilterProps {
  onFilterChange: (filters: ServiceFilterState) => void;
  activeFilters: ServiceFilterState;
  availableTags?: string[];
}

export function ServiceFilter({ 
  onFilterChange, 
  activeFilters,
  availableTags = []
}: ServiceFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<ServiceFilterState>(activeFilters);

  // Sync local state with prop changes
  React.useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  const handleStatusToggle = (status: "healthy" | "degraded" | "down") => {
    const newStatus = localFilters.status.includes(status)
      ? localFilters.status.filter(s => s !== status)
      : [...localFilters.status, status];
    
    const newFilters = { ...localFilters, status: newStatus };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (query: string) => {
    const newFilters = { ...localFilters, searchQuery: query };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = localFilters.tags.includes(tag)
      ? localFilters.tags.filter(t => t !== tag)
      : [...localFilters.tags, tag];
    
    const newFilters = { ...localFilters, tags: newTags };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearAll = () => {
    const emptyFilters: ServiceFilterState = {
      status: [],
      searchQuery: "",
      tags: [],
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount = 
    localFilters.status.length + 
    localFilters.tags.length + 
    (localFilters.searchQuery ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Search Input */}
      <Input
        type="text"
        placeholder="Search services..."
        value={localFilters.searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-64"
      />

      {/* Filter Popover */}
      <ClientPopover open={open} onOpenChange={setOpen}>
        <ClientPopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <IconFilter className="size-4" />
            Filter
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </ClientPopoverTrigger>
        <ClientPopoverContent className="w-80" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Services</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-auto p-1 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="status-healthy"
                    checked={localFilters.status.includes("healthy")}
                    onCheckedChange={() => handleStatusToggle("healthy")}
                  />
                  <label
                    htmlFor="status-healthy"
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <div className="size-2 rounded-full bg-green-500" />
                    Healthy
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="status-degraded"
                    checked={localFilters.status.includes("degraded")}
                    onCheckedChange={() => handleStatusToggle("degraded")}
                  />
                  <label
                    htmlFor="status-degraded"
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <div className="size-2 rounded-full bg-yellow-500" />
                    Degraded
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="status-down"
                    checked={localFilters.status.includes("down")}
                    onCheckedChange={() => handleStatusToggle("down")}
                  />
                  <label
                    htmlFor="status-down"
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <div className="size-2 rounded-full bg-red-500" />
                    Down
                  </label>
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <div key={tag} className="flex items-center gap-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={localFilters.tags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                      />
                      <label
                        htmlFor={`tag-${tag}`}
                        className="text-sm cursor-pointer"
                      >
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">
                  Active filters: {activeFilterCount}
                </div>
                <div className="flex flex-wrap gap-1">
                  {localFilters.status.map((status) => (
                    <Badge
                      key={status}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {status}
                      <button
                        onClick={() => handleStatusToggle(status)}
                        className="hover:bg-muted rounded p-0.5"
                      >
                        <IconX className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  {localFilters.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleTagToggle(tag)}
                        className="hover:bg-muted rounded p-0.5"
                      >
                        <IconX className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ClientPopoverContent>
      </ClientPopover>

      {/* Clear Filters Button (outside popover) */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="gap-1"
        >
          <IconX className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
