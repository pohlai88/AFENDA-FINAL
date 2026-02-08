"use client";

/**
 * System Uptime Card
 * Displays system uptime percentage and status.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from "@afenda/shadcn";
import { logger } from "@afenda/shared";

interface UptimeData {
  percentage: number;
  uptime: number; // seconds
  lastIncident?: Date | string;
  status: "operational" | "degraded" | "down";
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function SystemUptimeCard() {
  const [uptime, setUptime] = React.useState<UptimeData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUptime = async () => {
      setIsLoading(true);
      try {
        // Mock uptime data
        const mockUptime: UptimeData = {
          percentage: 99.98,
          uptime: 2592000, // 30 days
          lastIncident: new Date(Date.now() - 15552000000), // 180 days ago
          status: "operational",
        };

        setUptime(mockUptime);
      } catch (error) {
        logger.error("Failed to fetch uptime", error as Error, { component: "SystemUptimeCard" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUptime();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Uptime</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!uptime) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">System Uptime</CardTitle>
          <Badge variant={uptime.status === "operational" ? "default" : uptime.status === "degraded" ? "secondary" : "destructive"}>
            {uptime.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-4xl font-bold tabular-nums">{uptime.percentage}%</span>
            <span className="text-sm text-muted-foreground">Last 30 days</span>
          </div>
          <Progress value={uptime.percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground">Current Uptime</div>
            <div className="text-lg font-semibold">{formatUptime(uptime.uptime)}</div>
          </div>
          {uptime.lastIncident && (
            <div>
              <div className="text-sm text-muted-foreground">Last Incident</div>
              <div className="text-lg font-semibold">
                {Math.floor((Date.now() - new Date(uptime.lastIncident).getTime()) / 86400000)}d ago
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
