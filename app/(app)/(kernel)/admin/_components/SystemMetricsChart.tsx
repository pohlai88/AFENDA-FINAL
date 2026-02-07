"use client";

/**
 * System Metrics Chart
 * Service performance metrics visualization.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@afenda/shadcn";

interface MetricData {
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "error";
}

export function SystemMetricsChart() {
  const [metrics, setMetrics] = React.useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        // Mock metrics data
        const mockMetrics: MetricData[] = [
          { label: "Response Time", value: 45, unit: "ms", trend: "down", status: "good" },
          { label: "CPU Usage", value: 32, unit: "%", trend: "stable", status: "good" },
          { label: "Memory Usage", value: 68, unit: "%", trend: "up", status: "warning" },
          { label: "Active Connections", value: 127, unit: "", trend: "up", status: "good" },
        ];

        setMetrics(mockMetrics);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">System Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                <Badge variant={metric.status === "good" ? "default" : metric.status === "warning" ? "secondary" : "destructive"} className="text-xs">
                  {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→"}
                </Badge>
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {metric.value}{metric.unit}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
