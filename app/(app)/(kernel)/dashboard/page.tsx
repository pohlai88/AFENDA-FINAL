/**
 * Dashboard Page - Enterprise Production Ready
 * Overview with metrics and quick actions using Next.js 16 best practices.
 *
 * @domain app
 * @layer page
 */

import "server-only";

import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { IconActivity } from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@afenda/shadcn";
import { ClientTabs, ClientTabsContent, ClientTabsList, ClientTabsTrigger } from "@afenda/shadcn";

import { checkAllServiceHealth, queryAuditLogs, getHealthHistory } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import { EnhancedQuickActionsCard } from "./_components/EnhancedQuickActionsCard";
import { SystemMetricsCard } from "./_components/SystemMetricsCard";
import { RecentActivityEmptyState } from "./_components/RecentActivityEmptyState";
import { CardHelpTooltip } from "./_components/CardHelpTooltip";
import { DASHBOARD_HELP_CONTENT } from "./_components/helpContent";
import { InteractiveMetric } from "./_components/InteractiveMetric";
import { DashboardContent } from "./_components/DashboardContent";
import { DashboardLoadingState } from "./_components/DashboardLoadingState";
import { formatUptime, calculateHealthPercentage, transformHealthHistory, calculateMetricChange } from "./_lib/dashboard-utils";
import { EnterpriseActivityTrail } from "./_components/EnterpriseActivityTrail";
import { HealthStreamWidget } from "./_components/HealthStreamWidget";
import { DashboardMachinaSlot } from "./_components/DashboardMachinaSlot.client";

// Metadata for SEO and Open Graph
export const metadata: Metadata = {
  title: "Dashboard | Afenda Enterprise Platform",
  description: "Real-time system health monitoring, metrics, and administrative quick actions",
  openGraph: {
    title: "Dashboard | Afenda Enterprise Platform",
    description: "Real-time system health monitoring and administrative dashboard",
  },
  robots: {
    index: false, // Dashboard should not be indexed
    follow: false,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 30; // Cache for 30 seconds
export const runtime = "nodejs"; // Use Node.js runtime for server functions

// Cached data fetching functions for request deduplication
const getCachedHealthData = cache(async () => {
  return checkAllServiceHealth({ db });
});

const getCachedAuditData = cache(async () => {
  return queryAuditLogs({ db }, { limit: 25 });
});

const getCachedHealthHistory = cache(async () => {
  return getHealthHistory({ db }, { hours: 24, limit: 24 });
});

// Generate static params at build time (empty for dynamic routes)
export async function generateStaticParams() {
  return [];
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const initialMachinaOpen =
    sp?.machina === "1" || (Array.isArray(sp?.machina) && sp.machina[0] === "1");

  return (
    <DashboardContent>
      <Suspense fallback={<DashboardLoadingState />}>
        <DashboardPageContent initialMachinaOpen={initialMachinaOpen} />
      </Suspense>
    </DashboardContent>
  );
}

async function DashboardPageContent({
  initialMachinaOpen = false,
}: {
  initialMachinaOpen?: boolean;
}) {
  // Fetch health and recent audit data using cached functions
  const [healthResult, auditResult, historyResult] = await Promise.all([
    getCachedHealthData(),
    getCachedAuditData(),
    getCachedHealthHistory(),
  ]);

  const health = healthResult.ok ? healthResult.data : null;
  const recentAudit = auditResult.ok ? auditResult.data.entries : [];
  const healthHistory = historyResult.ok ? historyResult.data.entries : [];

  // Calculate metrics using utility functions
  const healthPercentage = calculateHealthPercentage(health);
  const uptimeFormatted = health?.uptime ? formatUptime(health.uptime) : "N/A";

  // Transform historical data for chart
  const historicalData = transformHealthHistory(healthHistory);

  // Calculate previous health percentage from historical data (1 hour ago)
  const oneHourAgo = historicalData.length > 0 
    ? historicalData[Math.max(0, historicalData.length - 2)]?.value ?? healthPercentage
    : healthPercentage;
  const previousHealthPercentage = oneHourAgo;
  
  // Calculate metric change statistics using real historical data
  const metricChange = calculateMetricChange(healthPercentage, previousHealthPercentage);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Machina panel: opens from FAB (event) or ?machina=1 */}
      <DashboardMachinaSlot
        systemHealth={health}
        recentAudit={recentAudit}
        initialOpenFromQuery={initialMachinaOpen}
      />
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and quick actions
          </p>
        </div>
        
        {/* Machina: services needing attention */}
        {(health?.summary?.down || 0) > 0 && (
          <Badge variant="destructive" className="gap-2 px-3 py-1.5">
            <IconActivity className="h-4 w-4 animate-pulse" />
            {health?.summary?.down} service{((health?.summary?.down || 0) > 1) ? 's' : ''} need attention
          </Badge>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6">
        {/* Metrics Overview */}
        <section>
          <div className="metric-card-grid">
            <InteractiveMetric
              title="System Health"
              value={`${healthPercentage}%`}
              description="Overall system health percentage"
              badge={health?.status ?? "Unknown"}
              badgeVariant={health?.status === "healthy" ? "default" : "destructive"}
              helpContent={DASHBOARD_HELP_CONTENT["system-health"]}
              detailData={{
                currentValue: healthPercentage,
                previousValue: previousHealthPercentage,
                change: metricChange.change,
                changePercent: metricChange.changePercent,
                trend: metricChange.trend,
                historicalData,
                relatedMetrics: [
                  { name: "Total Services", value: health?.summary?.total ?? 0, unit: "services" },
                  { name: "Healthy Services", value: health?.summary?.healthy ?? 0, unit: "online" },
                  { name: "Degraded Services", value: health?.summary?.degraded ?? 0, unit: "degraded" },
                  { name: "Down Services", value: health?.summary?.down ?? 0, unit: "offline" },
                  { name: "System Uptime", value: health?.uptime ?? 0, unit: uptimeFormatted },
                ],
                alerts: [
                  ...(health?.summary?.down && health.summary.down > 0 ? [{
                    level: "error" as const,
                    message: `${health.summary.down} service${health.summary.down > 1 ? 's' : ''} currently down`,
                    timestamp: new Date(),
                  }] : []),
                  ...(health?.summary?.degraded && health.summary.degraded > 0 ? [{
                    level: "warning" as const,
                    message: `${health.summary.degraded} service${health.summary.degraded > 1 ? 's' : ''} experiencing degraded performance`,
                    timestamp: new Date(),
                  }] : []),
                  ...(health?.status === "healthy" && healthPercentage === 100 ? [{
                    level: "info" as const,
                    message: "All services operating normally",
                    timestamp: new Date(),
                  }] : []),
                ],
              }}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                {health?.summary?.healthy ?? 0} of {health?.summary?.total ?? 0} services healthy
              </div>
              <div className="text-xs text-muted-foreground">
                Uptime: {uptimeFormatted}
              </div>
            </InteractiveMetric>

            <Card className="relative">
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardHelpTooltip content={DASHBOARD_HELP_CONTENT["services"]} />
                  <CardDescription>Services</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <CardTitle className="text-2xl font-bold tabular-nums">{health?.summary?.total ?? 0}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {health?.summary?.degraded ?? 0} degraded, {health?.summary?.down ?? 0} down
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <Badge variant="outline" className="absolute top-3 right-3 text-xs border-green-500 text-green-600 dark:text-green-400">
                <IconActivity className="mr-1 h-3 w-3" />
                Live
              </Badge>
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardHelpTooltip content={DASHBOARD_HELP_CONTENT["system-status"]} />
                  <CardDescription>System Status</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl font-bold capitalize tabular-nums">{health?.status ?? "Unknown"}</CardTitle>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardHelpTooltip content={DASHBOARD_HELP_CONTENT["audit-events"]} />
                  <CardDescription>Audit Events</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <CardTitle className="text-2xl font-bold tabular-nums">{recentAudit.length}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  System events tracked
                </p>
              </CardContent>
            </Card>

            <HealthStreamWidget />
          </div>
        </section>

        {/* Detailed Views */}
        <ClientTabs defaultValue="overview" className="flex flex-1 flex-col">
          <ClientTabsList className="grid w-full grid-cols-3" role="tablist" aria-label="Dashboard sections">
            <ClientTabsTrigger value="overview" aria-label="Overview section">Overview</ClientTabsTrigger>
            <ClientTabsTrigger value="metrics" aria-label="Metrics section">Metrics</ClientTabsTrigger>
            <ClientTabsTrigger value="activity" aria-label="Activity section">Activity</ClientTabsTrigger>
          </ClientTabsList>

          <ClientTabsContent value="overview" className="flex-1">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <EnhancedQuickActionsCard
                  systemHealth={health}
                  recentAudit={recentAudit}
                />
              </div>
              <div>
                <SystemMetricsCard
                  metrics={{
                    healthPercentage,
                    status: (health?.status ?? "down") as "healthy" | "degraded" | "down",
                    totalServices: health?.summary?.total ?? 0,
                    healthyServices: health?.summary?.healthy ?? 0,
                    degradedServices: health?.summary?.degraded ?? 0,
                    downServices: health?.summary?.down ?? 0,
                    uptimeSeconds: health?.uptime ?? 0,
                  }}
                />
              </div>
            </div>
          </ClientTabsContent>

          <ClientTabsContent value="metrics" className="flex-1">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                  <CardDescription>
                    Detailed performance metrics and system health indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SystemMetricsCard
                    metrics={{
                      healthPercentage,
                      status: (health?.status ?? "down") as "healthy" | "degraded" | "down",
                      totalServices: health?.summary?.total ?? 0,
                      healthyServices: health?.summary?.healthy ?? 0,
                      degradedServices: health?.summary?.degraded ?? 0,
                      downServices: health?.summary?.down ?? 0,
                      uptimeSeconds: health?.uptime ?? 0,
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </ClientTabsContent>

          <ClientTabsContent value="activity" className="flex-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardHelpTooltip content={DASHBOARD_HELP_CONTENT["recent-activity"]} />
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest audit events and system activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recentAudit.length === 0 ? (
                  <RecentActivityEmptyState />
                ) : (
                  <EnterpriseActivityTrail entries={recentAudit} maxHeight="500px" />
                )}
              </CardContent>
            </Card>
          </ClientTabsContent>
        </ClientTabs>
      </div>

    </div>
  );
}
