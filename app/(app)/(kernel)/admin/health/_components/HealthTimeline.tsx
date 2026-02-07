"use client";

/**
 * Health Timeline Component
 * Visualizes service health history over time.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import useSWR from "swr";
import { IconLoader2, IconClock } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

interface HealthHistoryEntry {
  id: string;
  serviceId: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number | null;
  errorMessage: string | null;
  recordedAt: string;
}

interface HealthTimelineProps {
  serviceId: string;
  serviceName?: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();
  if (data.ok) {
    return data.data;
  }
  throw new Error(data.error?.message || "Failed to fetch health history");
};

export function HealthTimeline({ serviceId, serviceName }: HealthTimelineProps) {
  const [hours, setHours] = React.useState("24");

  const apiUrl = `${routes.api.orchestra.health()}/history?serviceId=${serviceId}&hours=${hours}&limit=100`;

  const { data, error, isLoading } = useSWR<{ entries: HealthHistoryEntry[]; total: number }>(
    apiUrl,
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "healthy":
        return "Healthy";
      case "degraded":
        return "Degraded";
      case "down":
        return "Down";
      default:
        return "Unknown";
    }
  };

  const calculateUptime = () => {
    if (!data?.entries || data.entries.length === 0) return 0;
    const healthyCount = data.entries.filter((e) => e.status === "healthy").length;
    return Math.round((healthyCount / data.entries.length) * 100 * 100) / 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconClock className="size-5" />
              Health Timeline
              {serviceName && <span className="text-muted-foreground">- {serviceName}</span>}
            </CardTitle>
            <CardDescription>
              Service health history and uptime tracking
            </CardDescription>
          </div>
          <ClientSelect value={hours} onValueChange={setHours}>
            <ClientSelectTrigger className="w-32">
              <ClientSelectValue />
            </ClientSelectTrigger>
            <ClientSelectContent>
              <ClientSelectItem value="1">Last Hour</ClientSelectItem>
              <ClientSelectItem value="6">Last 6 Hours</ClientSelectItem>
              <ClientSelectItem value="24">Last 24 Hours</ClientSelectItem>
              <ClientSelectItem value="168">Last 7 Days</ClientSelectItem>
            </ClientSelectContent>
          </ClientSelect>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Failed to load health history
          </div>
        ) : !data?.entries || data.entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No health history available for this time range
          </div>
        ) : (
          <div className="space-y-6">
            {/* Uptime Summary */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Uptime</div>
                <div className="text-2xl font-bold">{calculateUptime()}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Checks</div>
                <div className="text-2xl font-bold">{data.total}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Latency</div>
                <div className="text-2xl font-bold">
                  {Math.round(
                    data.entries.reduce((sum, e) => sum + (e.latencyMs || 0), 0) /
                    data.entries.length
                  )}
                  ms
                </div>
              </div>
            </div>

            {/* Timeline Visualization (Simple Bar Chart) */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Status History</div>
              <div className="flex gap-1 h-12 items-end">
                {data.entries.slice(0, 50).reverse().map((entry) => {
                  const heightPercent = entry.latencyMs
                    ? Math.min((entry.latencyMs / 1000) * 100, 100)
                    : 10;

                  return (
                    <div
                      key={entry.id}
                      className="flex-1 group relative"
                      style={{ minWidth: "4px" }}
                    >
                      <div
                        className={`w-full rounded-t transition-all ${getStatusColor(entry.status)}`}
                        style={{ height: `${Math.max(heightPercent, 10)}%` }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg p-2 whitespace-nowrap border">
                          <div className="font-medium">{getStatusText(entry.status)}</div>
                          <div className="text-muted-foreground">
                            {new Date(entry.recordedAt).toLocaleTimeString()}
                          </div>
                          {entry.latencyMs && (
                            <div className="text-muted-foreground">{entry.latencyMs}ms</div>
                          )}
                          {entry.errorMessage && (
                            <div className="text-destructive text-xs">{entry.errorMessage}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Oldest</span>
                <span>Most Recent</span>
              </div>
            </div>

            {/* Recent Events */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Recent Events</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.entries.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 rounded-md border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-3 rounded-full ${getStatusColor(entry.status)}`} />
                      <div>
                        <div className="text-sm font-medium">{getStatusText(entry.status)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(entry.recordedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {entry.latencyMs && (
                        <div className="text-sm">{entry.latencyMs}ms</div>
                      )}
                      {entry.errorMessage && (
                        <div className="text-xs text-destructive">{entry.errorMessage}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
