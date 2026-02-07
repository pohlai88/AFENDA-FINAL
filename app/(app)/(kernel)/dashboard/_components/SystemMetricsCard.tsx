/**
 * System Metrics Card
 * Visual display of system health metrics.
 */

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from "@afenda/shadcn";
import { CardHelpTooltip } from "./CardHelpTooltip";
import { DASHBOARD_HELP_CONTENT } from "./helpContent";
import { getHealthColor } from "./colorUtils";
import { formatUptime } from "../_lib/dashboard-utils";

export interface SystemMetrics {
  healthPercentage: number;
  status: "healthy" | "degraded" | "down";
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  uptimeSeconds: number;
}

export interface SystemMetricsCardProps {
  metrics: SystemMetrics;
}

export const SystemMetricsCard = React.memo(function SystemMetricsCard({ metrics }: SystemMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardHelpTooltip content={DASHBOARD_HELP_CONTENT["system-metrics"]} />
          <div>
            <CardTitle>System Metrics</CardTitle>
            <CardDescription>Real-time system health overview</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6" aria-live="polite" aria-atomic="true">
        {/* Overall Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Health</span>
            <span className="tabular-nums">{metrics.healthPercentage}%</span>
          </div>
          <Progress
            value={metrics.healthPercentage}
            className="h-2"
          />
        </div>

        {/* Service Breakdown */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className={`text-2xl font-semibold tabular-nums ${getHealthColor("healthy")}`}>
              {metrics.healthyServices}
            </p>
            <p className="text-xs text-muted-foreground">Healthy</p>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-semibold tabular-nums ${getHealthColor("degraded")}`}>
              {metrics.degradedServices}
            </p>
            <p className="text-xs text-muted-foreground">Degraded</p>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-semibold tabular-nums ${getHealthColor("down")}`}>
              {metrics.downServices}
            </p>
            <p className="text-xs text-muted-foreground">Down</p>
          </div>
        </div>

        {/* System Uptime */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">System Uptime</span>
            <span className="font-mono font-semibold">{formatUptime(metrics.uptimeSeconds)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
