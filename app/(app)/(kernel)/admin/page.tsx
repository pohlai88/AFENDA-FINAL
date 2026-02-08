/**
 * Kernel Admin Dashboard
 * Unified overview of all kernel administration features.
 *
 * @domain admin
 * @layer page
 */

import "server-only";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import {
  IconSettings,
  IconHeartbeat,
  IconShield,
  IconDatabase,
  IconChartBar,
  IconTemplate,
  IconArrowRight,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";

import { checkAllServiceHealth, queryAuditLogs } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import { routes } from "@afenda/shared/constants";
import { AdminContent } from "./_components/AdminContent";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  return (
    <AdminContent>
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboardContent />
      </Suspense>
    </AdminContent>
  );
}

async function AdminDashboardContent() {
  // Fetch dashboard data
  const [healthResult, auditResult] = await Promise.all([
    checkAllServiceHealth({ db }),
    queryAuditLogs({ db }, { limit: 5 }),
  ]);

  const health = healthResult.ok ? healthResult.data : null;
  const recentEvents = auditResult.ok ? auditResult.data.entries : [];
  const systemStatus = health?.status ?? "unknown";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Kernel Administration</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage system configuration, monitor health, and maintain infrastructure
        </p>
      </div>

      {/* System Status Banner */}
      <Alert
        variant={systemStatus === "healthy" ? "default" : "destructive"}
        className={
          systemStatus === "healthy"
            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
            : ""
        }
      >
        <IconHeartbeat className="size-5" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            System Status:{" "}
            <strong className="capitalize">{systemStatus}</strong>
            {health?.summary && (
              <span className="ml-2 text-sm">
                ({health.summary.healthy}/{health.summary.total} services healthy)
              </span>
            )}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.admin.health()}>
              View Details
              <IconArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <IconHeartbeat className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{systemStatus}</div>
            <p className="text-xs text-muted-foreground">
              {health?.summary?.total ?? 0} services monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
            <IconShield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEvents.length}</div>
            <p className="text-xs text-muted-foreground">Last 5 audit entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            <IconSettings className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">System configured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Backups</CardTitle>
            <IconDatabase className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ready</div>
            <p className="text-xs text-muted-foreground">Backup system active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Features - Dashboard Pattern */}
      <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
        {/* Configuration Management */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <IconSettings className="size-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Configuration Management</CardTitle>
                  <CardDescription>Manage system and tenant settings</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Core</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure system behavior, tenant settings, and service parameters using
              pre-built templates or custom configurations.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="default" className="w-full justify-between" asChild>
                <Link href={routes.ui.admin.config()}>
                  Manage Configurations
                  <IconArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href={routes.ui.admin.configTemplates()}>
                  <IconTemplate className="mr-2 size-4" />
                  Browse Templates
                  <IconArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                  <IconHeartbeat className="size-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Monitor services and diagnostics</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Monitor</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Real-time health monitoring of all registered services with automatic checks
              every 30 seconds and instant alerts.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="default" className="w-full justify-between" asChild>
                <Link href={routes.ui.admin.health()}>
                  View Health Dashboard
                  <IconArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
                  <IconShield className="size-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Audit Log</CardTitle>
                  <CardDescription>Immutable event tracking</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Security</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete audit trail of all system events, configuration changes, and
              operations with 365-day retention.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="default" className="w-full justify-between" asChild>
                <Link href={routes.ui.admin.audit()}>
                  View Audit Log
                  <IconArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950">
                  <IconDatabase className="size-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>Data protection and recovery</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Critical</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create system backups, manage restore points, and ensure business continuity
              with automated backup operations.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="default" className="w-full justify-between" asChild>
                <Link href={routes.ui.admin.backup()}>
                  Manage Backups
                  <IconArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Assignments */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950">
                  <IconShield className="size-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle>Admin Assignments</CardTitle>
                  <CardDescription>Primary admin, delegated admins, RBAC</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Access</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assign the primary administrator, add delegated admins with scoped roles,
              and manage role-based access control.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="default" className="w-full justify-between" asChild>
                <Link href={routes.ui.admin.admins()}>
                  Manage Admin Assignments
                  <IconArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentEvents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and changes</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={routes.ui.admin.audit()}>
                  View All
                  <IconArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <IconChartBar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{event.eventType}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.entityType} • {event.actorId ?? "System"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Section - Moved to Bottom */}
      <div className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Administration Tools</h2>
            <p className="text-sm text-muted-foreground">Quick access to system management</p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>New to kernel administration? Start here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href={routes.ui.admin.configTemplates()}>
                  <IconTemplate className="mr-2 size-4" />
                  Browse Configuration Templates
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href={routes.ui.admin.health()}>
                  <IconHeartbeat className="mr-2 size-4" />
                  Check System Health
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function AdminDashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="h-16 w-64 bg-muted animate-pulse rounded" />
      <div className="h-24 w-full bg-muted animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}