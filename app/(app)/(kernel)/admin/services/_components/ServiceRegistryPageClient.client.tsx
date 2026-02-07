/**
 * Service Registry Page Client Component
 * Client-side interactivity, filtering, and actions
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconEye,
  IconEdit,
  IconHeartbeat,
  IconTrash,
  IconDotsVertical,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import {
  Button,
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
  Input,
  Badge,
} from "@afenda/shadcn";
import { toast } from "sonner";
import type { ServiceRecord } from "@afenda/orchestra/zod";
import { routes } from "@afenda/shared/constants";
import { ServiceRegistryTableEnhanced } from "./ServiceRegistryTableEnhanced.client";
import { ServiceMetadataDialog } from "./ServiceMetadataDialog.client";
import { ServiceDetailSheet } from "./ServiceDetailSheet.client";
import { useEnterpriseSearch, createSearchFields } from "../../../../_hooks/useEnterpriseSearch";

interface ServiceRegistryPageClientProps {
  services: ServiceRecord[];
}

export function ServiceRegistryPageClient({ services }: ServiceRegistryPageClientProps) {
  const router = useRouter();
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Enterprise-grade search with advanced features
  const enterpriseSearch = useEnterpriseSearch(services, {
    fields: createSearchFields.services(),
    debounceMs: 300,
    cacheTTL: 5000,
    limit: 50,
    sortBy: 'relevance',
    filters: statusFilter !== "all" ? { status: statusFilter } : {},
  });

  const filteredServices = enterpriseSearch.items;

  const handleViewDetails = (serviceId: string) => {
    setSelectedService(services.find((s) => s.id === serviceId) || null);
    setDetailSheetOpen(true);
  };

  const handleEditMetadata = (serviceId: string) => {
    setSelectedService(services.find((s) => s.id === serviceId) || null);
    setMetadataDialogOpen(true);
  };

  const handleTestHealth = async (serviceId: string) => {
    try {
      const response = await fetch(
        routes.api.orchestra.serviceHealth(serviceId),
        { method: "POST" }
      );
      const result = await response.json();

      if (result.ok) {
        toast.success(`Health Check: ${result.data.status} (${result.data.latencyMs}ms)`);
        router.refresh();
      } else {
        toast.error(result.error?.message || "Health check failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleUnregister = async (serviceIds: string[]) => {
    if (!confirm(`Are you sure you want to unregister ${serviceIds.length} service(s)?`)) {
      return;
    }

    try {
      const results = await Promise.all(
        serviceIds.map(async (id) => {
          const response = await fetch(routes.api.orchestra.serviceById(id), {
            method: "DELETE",
          });
          return response.json();
        })
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast.error(`Failed to unregister ${failed.length} service(s)`);
      } else {
        toast.success(`Unregistered ${serviceIds.length} service(s)`);
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // Add actions column to services
  const servicesWithActions = filteredServices.map((service: ServiceRecord) => ({
    ...service,
    actions: (
      <ClientDropdownMenu>
        <ClientDropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <IconDotsVertical className="size-4" />
          </Button>
        </ClientDropdownMenuTrigger>
        <ClientDropdownMenuContent align="end">
          <ClientDropdownMenuItem onClick={() => handleViewDetails(service.id)}>
            <IconEye className="mr-2 size-4" />
            View Details
          </ClientDropdownMenuItem>
          <ClientDropdownMenuItem onClick={() => handleEditMetadata(service.id)}>
            <IconEdit className="mr-2 size-4" />
            Edit Metadata
          </ClientDropdownMenuItem>
          <ClientDropdownMenuItem onClick={() => handleTestHealth(service.id)}>
            <IconHeartbeat className="mr-2 size-4" />
            Test Health
          </ClientDropdownMenuItem>
          <ClientDropdownMenuSeparator />
          <ClientDropdownMenuItem
            onClick={() => handleUnregister([service.id])}
            className="text-destructive"
          >
            <IconTrash className="mr-2 size-4" />
            Unregister
          </ClientDropdownMenuItem>
        </ClientDropdownMenuContent>
      </ClientDropdownMenu>
    ),
  }));

  const statusCounts = {
    all: services.length,
    healthy: services.filter((s) => s.status === "healthy").length,
    degraded: services.filter((s) => s.status === "degraded").length,
    unhealthy: services.filter((s) => s.status === "unhealthy").length,
    registered: services.filter((s) => s.status === "registered").length,
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 border-b px-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={enterpriseSearch.query}
              onChange={(e) => enterpriseSearch.search(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconFilter className="size-4 text-muted-foreground" />
          <div className="flex gap-1">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All <Badge variant="secondary" className="ml-1.5">{statusCounts.all}</Badge>
            </Button>
            <Button
              variant={statusFilter === "healthy" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("healthy")}
            >
              Healthy <Badge variant="secondary" className="ml-1.5">{statusCounts.healthy}</Badge>
            </Button>
            <Button
              variant={statusFilter === "degraded" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("degraded")}
            >
              Degraded <Badge variant="secondary" className="ml-1.5">{statusCounts.degraded}</Badge>
            </Button>
            <Button
              variant={statusFilter === "unhealthy" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("unhealthy")}
            >
              Unhealthy <Badge variant="secondary" className="ml-1.5">{statusCounts.unhealthy}</Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {enterpriseSearch.query || statusFilter !== "all" ? (
        <div className="px-6 text-sm text-muted-foreground">
          Showing {enterpriseSearch.total} of {services.length} services
          {enterpriseSearch.query && ` matching "${enterpriseSearch.query}"`}
          {enterpriseSearch.searchTime > 0 && ` (${enterpriseSearch.searchTime}ms)`}
        </div>
      ) : null}

      {/* Service Table */}
      <div className="px-6 pb-6">
        <ServiceRegistryTableEnhanced
          services={servicesWithActions}
          onUnregister={handleUnregister}
        />
      </div>

      {/* Dialogs and Sheets */}
      {selectedService && (
        <>
          <ServiceMetadataDialog
            serviceId={selectedService.id}
            currentMetadata={{
              description: selectedService.description || undefined,
              version: selectedService.version || undefined,
              tags: selectedService.tags || undefined,
              ownerContact: selectedService.ownerContact || undefined,
              documentationUrl: selectedService.documentationUrl || undefined,
              healthCheckIntervalMs: selectedService.healthCheckIntervalMs || undefined,
              healthCheckTimeoutMs: selectedService.healthCheckTimeoutMs || undefined,
            }}
            open={metadataDialogOpen}
            onClose={() => {
              setMetadataDialogOpen(false);
              setSelectedService(null);
            }}
          />

          <ServiceDetailSheet
            serviceId={selectedService.id}
            open={detailSheetOpen}
            onClose={() => {
              setDetailSheetOpen(false);
              setSelectedService(null);
            }}
          />
        </>
      )}
    </div>
  );
}
