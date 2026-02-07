"use client";

/**
 * Health Page Client Component
 * Client-side filtering and interaction for health dashboard.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import {
  IconCircleCheckFilled,
  IconAlertTriangle,
  IconCircleXFilled,
} from "@tabler/icons-react";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@afenda/shadcn";
import { ServiceFilter } from "./ServiceFilter";
import { useServiceFilter } from "../_hooks/useServiceFilter";

interface ServiceHealth {
  serviceId: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number | null;
  lastCheck: string;
  error: string | null;
  tags?: string[];
}

interface HealthPageClientProps {
  services: ServiceHealth[];
}

function getStatusIcon(status: string, className = "size-4") {
  switch (status) {
    case "healthy":
      return <IconCircleCheckFilled className={`${className} text-green-500`} />;
    case "degraded":
      return <IconAlertTriangle className={`${className} text-yellow-500`} />;
    case "down":
      return <IconCircleXFilled className={`${className} text-red-500`} />;
    default:
      return <IconAlertTriangle className={`${className} text-gray-500`} />;
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "healthy":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400";
    case "degraded":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400";
    case "down":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400";
    default:
      return "";
  }
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function HealthPageClient({ services }: HealthPageClientProps) {
  const {
    filters,
    setFilters,
    filteredServices,
    availableTags,
    hasActiveFilters,
    totalCount,
    filteredCount,
  } = useServiceFilter(services);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <ServiceFilter
          onFilterChange={setFilters}
          activeFilters={filters}
          availableTags={availableTags}
        />
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters ? (
            <>
              Showing {filteredCount} of {totalCount} services
            </>
          ) : (
            <>{totalCount} services</>
          )}
        </div>
      </div>

      {/* Services Table */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {hasActiveFilters ? (
            <>
              <p className="text-lg font-medium mb-2">No services match your filters</p>
              <p className="text-sm">Try adjusting your filter criteria</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">No services registered</p>
              <p className="text-sm">Services will appear here once registered</p>
            </>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Last Check</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => (
              <TableRow key={service.serviceId}>
                <TableCell className="font-medium">
                  {service.serviceId}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getStatusBadgeClass(service.status)}
                  >
                    {getStatusIcon(service.status, "size-3 mr-1")}
                    {service.status}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">
                  {service.latencyMs ? `${service.latencyMs}ms` : "N/A"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRelativeTime(new Date(service.lastCheck))}
                </TableCell>
                <TableCell className="text-destructive">
                  {service.error ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
