/**
 * Uptime Stats Display
 * Shows service uptime percentage and statistics
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn";

interface UptimeStatsProps {
  uptime: number;
  total: number;
  healthy: number;
  hours: number;
}

export function UptimeStats({ uptime, total, healthy, hours }: UptimeStatsProps) {
  const unhealthy = total - healthy;
  const uptimeColor = uptime >= 99 ? "text-green-600" : uptime >= 95 ? "text-yellow-600" : "text-red-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Uptime (Last {hours}h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Uptime percentage */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${uptimeColor}`}>
              {uptime.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Availability
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-semibold">{total}</div>
              <div className="text-xs text-muted-foreground">Total Checks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">{healthy}</div>
              <div className="text-xs text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">{unhealthy}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>

          {/* Visual bar */}
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${uptime}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {healthy} successful / {total} total
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
