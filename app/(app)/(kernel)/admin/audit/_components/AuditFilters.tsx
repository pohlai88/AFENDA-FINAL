"use client";

/**
 * Audit Filters
 * Filter controls for audit log page.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconFilter, IconX } from "@tabler/icons-react";

import {
  Button,
  Input,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn";

export interface AuditFiltersProps {
  eventType?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "service.registered", label: "Service Registered" },
  { value: "service.unregistered", label: "Service Unregistered" },
  { value: "service.health_changed", label: "Health Changed" },
  { value: "config.set", label: "Config Set" },
  { value: "config.deleted", label: "Config Deleted" },
  { value: "backup.started", label: "Backup Started" },
  { value: "backup.completed", label: "Backup Completed" },
  { value: "restore.started", label: "Restore Started" },
  { value: "restore.completed", label: "Restore Completed" },
];

const ENTITY_TYPES = [
  { value: "all", label: "All Entities" },
  { value: "service", label: "Service" },
  { value: "config", label: "Configuration" },
  { value: "backup", label: "Backup" },
];

export function AuditFilters({
  eventType,
  entityType,
  startDate,
  endDate,
}: AuditFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("?");
  };

  const hasFilters = eventType || entityType || startDate || endDate;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconFilter className="size-4 text-muted-foreground" />

      <ClientSelect
        value={eventType ?? "all"}
        onValueChange={(v) => updateParams("eventType", v)}
      >
        <ClientSelectTrigger className="w-[180px]">
          <ClientSelectValue placeholder="Event Type" />
        </ClientSelectTrigger>
        <ClientSelectContent>
          {EVENT_TYPES.map((type) => (
            <ClientSelectItem key={type.value} value={type.value}>
              {type.label}
            </ClientSelectItem>
          ))}
        </ClientSelectContent>
      </ClientSelect>

      <ClientSelect
        value={entityType ?? "all"}
        onValueChange={(v) => updateParams("entityType", v)}
      >
        <ClientSelectTrigger className="w-[150px]">
          <ClientSelectValue placeholder="Entity Type" />
        </ClientSelectTrigger>
        <ClientSelectContent>
          {ENTITY_TYPES.map((type) => (
            <ClientSelectItem key={type.value} value={type.value}>
              {type.label}
            </ClientSelectItem>
          ))}
        </ClientSelectContent>
      </ClientSelect>

      <Input
        type="date"
        value={startDate ?? ""}
        onChange={(e) => updateParams("startDate", e.target.value || null)}
        className="w-[150px]"
        placeholder="Start Date"
      />

      <Input
        type="date"
        value={endDate ?? ""}
        onChange={(e) => updateParams("endDate", e.target.value || null)}
        className="w-[150px]"
        placeholder="End Date"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <IconX className="mr-1 size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
