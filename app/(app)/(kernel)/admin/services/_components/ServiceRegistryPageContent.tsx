/**
 * Service Registry Page Content
 * Server component that fetches service data and displays overview
 */

import {
  IconServer,
  IconCircleCheckFilled,
  IconAlertTriangle,
  IconCircleXFilled,
  IconClock,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";

import { getService } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import { EmptyStateEnhanced } from "../../_components/EmptyStateEnhanced";
import { ServiceRegistryPageClient } from "./ServiceRegistryPageClient.client";

export const dynamic = "force-dynamic";

export async function ServiceRegistryPageContent() {
  // Fetch all services using listServices to get IDs
  const { listServices } = await import("@afenda/orchestra");
  const servicesListResult = await listServices({ db });

  if (!servicesListResult.ok) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Services</CardTitle>
            <CardDescription>{servicesListResult.error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch full details for each service
  const serviceIds = servicesListResult.data.services.map((s) => s.id);
  const servicesWithDetails = await Promise.all(
    serviceIds.map(async (id) => {
      const result = await getService({ db }, id);
      return result.ok ? result.data : null;
    })
  );

  const services = servicesWithDetails.filter((s): s is NonNullable<typeof s> => s !== null);

  // Calculate statistics
  const stats = {
    total: services.length,
    healthy: services.filter((s) => s.status === "healthy").length,
    degraded: services.filter((s) => s.status === "degraded").length,
    unhealthy: services.filter((s) => s.status === "unhealthy").length,
    registered: services.filter((s) => s.status === "registered").length,
  };

  const uptimePercentage = stats.total > 0 
    ? ((stats.healthy / stats.total) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Registry</h1>
            <p className="text-muted-foreground mt-1">
              Centralized service discovery and health monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Total Services</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <IconServer className="size-5 text-muted-foreground" />
              <span className="tabular-nums">{stats.total}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Registered in kernel
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Healthy</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <IconCircleCheckFilled className="size-5 text-green-600" />
              <span className="tabular-nums text-green-600">{stats.healthy}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {uptimePercentage}% uptime
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Degraded</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <IconAlertTriangle className="size-5 text-amber-600" />
              <span className="tabular-nums text-amber-600">{stats.degraded}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Needs attention
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Unhealthy</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <IconCircleXFilled className="size-5 text-red-600" />
              <span className="tabular-nums text-red-600">{stats.unhealthy}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Service failures
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Pending</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <IconClock className="size-5 text-blue-600" />
              <span className="tabular-nums text-blue-600">{stats.registered}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Awaiting checks
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Registry Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registered Services</CardTitle>
              <CardDescription className="mt-1.5">
                Monitor and manage all services in the kernel registry
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <div className="p-6">
              <EmptyStateEnhanced
                icon={<IconServer className="size-16 text-muted-foreground/30" />}
                title="No Services Registered"
                description="Services will automatically register with the kernel when they start up. The service registry provides centralized discovery and health monitoring."
                tips={[
                  "Services self-register at startup using the kernel API",
                  "Health checks run automatically to monitor service status",
                  "View detailed metrics and history for each service",
                ]}
              />
            </div>
          ) : (
            <ServiceRegistryPageClient services={services} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
