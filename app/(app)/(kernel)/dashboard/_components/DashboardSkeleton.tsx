/**
 * Dashboard Loading Skeleton
 * Optimized loading state for dashboard with proper accessibility
 * 
 * @domain app
 * @layer component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn";
import { Skeleton } from "@afenda/shadcn";

export function DashboardMetricsSkeleton() {
  return (
    <div className="metric-card-grid" role="status" aria-label="Loading dashboard metrics">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Loading metrics</span>
    </div>
  );
}

export function DashboardQuickActionsSkeleton() {
  return (
    <Card role="status" aria-label="Loading quick actions">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-5 w-32" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-48" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
      <span className="sr-only">Loading quick actions</span>
    </Card>
  );
}

export function DashboardContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6" role="status" aria-label="Loading dashboard">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      {/* Metrics Skeleton */}
      <DashboardMetricsSkeleton />

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardQuickActionsSkeleton />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      <span className="sr-only">Loading dashboard content, please wait...</span>
    </div>
  );
}
