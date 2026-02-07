/**
 * Dashboard Loading State
 * Displayed while dashboard data is being fetched.
 */

import * as React from "react";
import { Card, CardContent, CardHeader } from "@afenda/shadcn";

export const DashboardLoadingState = React.memo(function DashboardLoadingState() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>

      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded ml-auto" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Quick Actions skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Metrics skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-8 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-2 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded mx-auto" />
                  <div className="h-3 w-12 bg-muted animate-pulse rounded mx-auto" />
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
