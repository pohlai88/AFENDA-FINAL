/**
 * Admin Health Page
 * System health dashboard with service status monitoring.
 *
 * @domain admin
 * @layer page
 */

import "server-only";

import { Suspense } from "react";
import {
  IconCircleCheckFilled,
  IconAlertTriangle,
  IconCircleXFilled,
  IconServer,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";

import { checkAllServiceHealth, getDiagnostics } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import { EmptyStateEnhanced } from "../_components/EmptyStateEnhanced";
import { HealthTableEnhanced } from "./_components/HealthTableEnhanced.client";
import { HealthContent } from "./_components/HealthContent";
import { HealthLiveStream } from "./_components/HealthLiveStream";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  return (
    <HealthContent>
      <Suspense fallback={<HealthPageSkeleton />}>
        <HealthPageContent />
      </Suspense>
    </HealthContent>
  );
}

async function HealthPageContent() {
  const [healthResult, diagnosticsResult] = await Promise.all([
    checkAllServiceHealth({ db }),
    getDiagnostics({ db }),
  ]);

  const health = healthResult.ok ? healthResult.data : null;
  const diagnostics = diagnosticsResult.ok ? diagnosticsResult.data : null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">System Health</h1>
        <p className="text-muted-foreground">
          Monitor service health and system diagnostics
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Status</CardDescription>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(health?.status ?? "unknown")}
              <span className="capitalize">{health?.status ?? "Unknown"}</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Services</CardDescription>
            <CardTitle className="tabular-nums">
              {health?.summary?.total ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {health?.summary?.healthy ?? 0} healthy,{" "}
            {health?.summary?.degraded ?? 0} degraded,{" "}
            {health?.summary?.down ?? 0} down
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Uptime</CardDescription>
            <CardTitle className="tabular-nums">
              {formatUptime(health?.uptime ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Since last restart
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Environment</CardDescription>
            <CardTitle className="capitalize">
              {diagnostics?.environment ?? "Unknown"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Version: {diagnostics?.version ?? "Unknown"}
          </CardContent>
        </Card>
      </div>

      {/* Optional: live health stream (SSE) */}
      <HealthLiveStream />

      {/* Service table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            Health status of all registered services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!health?.services || health.services.length === 0 ? (
            <EmptyStateEnhanced
              icon={<IconServer className="size-16 text-muted-foreground/30" />}
              title="No Services Registered"
              description="Register services to monitor their health status. The health monitoring system tracks service availability and performance."
              tips={[
                "Services self-register with the kernel at startup",
                "Health checks run automatically every 30 seconds",
                "Failed health checks trigger alerts",
              ]}
            />
          ) : (
            <HealthTableEnhanced
              services={health.services.map((s) => ({
                id: s.serviceId,
                name: s.serviceId,
                status: s.status === "down" ? "unhealthy" : s.status,
                lastCheck: s.lastCheck,
                latency: s.latencyMs ?? undefined,
                errorMessage: s.error,
              }))}
            />
          )}
        </CardContent>
      </Card>

      {/* Memory diagnostics */}
      {diagnostics?.memory && (
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>Server memory diagnostics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Heap Used</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatBytes(diagnostics.memory.heapUsed)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Heap Total</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatBytes(diagnostics.memory.heapTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">External</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatBytes(diagnostics.memory.external)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Get status icon component.
 */
function getStatusIcon(status: string, className?: string) {
  const baseClass = className ?? "size-4";
  switch (status) {
    case "healthy":
      return <IconCircleCheckFilled className={`${baseClass} text-green-500`} />;
    case "degraded":
      return <IconAlertTriangle className={`${baseClass} text-yellow-500`} />;
    case "down":
    case "unhealthy":
      return <IconCircleXFilled className={`${baseClass} text-red-500`} />;
    default:
      return <IconServer className={`${baseClass} text-muted-foreground`} />;
  }
}

/**
 * Format uptime in human-readable format.
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format bytes in human-readable format.
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function HealthPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="h-16 w-64 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded" />
        ))}
      </div>
      <div className="h-96 bg-muted animate-pulse rounded" />
    </div>
  );
}
