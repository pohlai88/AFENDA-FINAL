/**
 * Health History Chart
 * Visualizes service health over time with latency metrics
 */

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn";

interface HealthHistoryEntry {
  id: string;
  serviceId: string;
  status: string;
  latencyMs: number | null;
  errorMessage: string | null;
  recordedAt: string;
}

interface HealthHistoryChartProps {
  entries: HealthHistoryEntry[];
  hours?: number;
}

export function HealthHistoryChart({ entries, hours = 24 }: HealthHistoryChartProps) {
  const chartData = useMemo(() => {
    // Sort entries by time (oldest first for chart)
    const sorted = [...entries].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    const maxLatency = Math.max(...sorted.map((e) => e.latencyMs || 0), 100);

    return { sorted, maxLatency };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Health History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No health history data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const { sorted, maxLatency } = chartData;
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate positions
  const points = sorted.map((entry, index) => {
    const x = padding.left + (index / Math.max(sorted.length - 1, 1)) * chartWidth;
    const latency = entry.latencyMs || 0;
    const y = padding.top + chartHeight - (latency / maxLatency) * chartHeight;

    return { x, y, entry };
  });

  // Create line path
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  // Create area path
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0},${
    padding.top + chartHeight
  } L ${padding.left},${padding.top + chartHeight} Z`;

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "hsl(var(--chart-1))"; // green
      case "degraded":
        return "hsl(var(--chart-3))"; // yellow
      case "down":
        return "hsl(var(--chart-5))"; // red
      default:
        return "hsl(var(--muted))";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Health History (Last {hours}h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg width={width} height={height} className="text-xs">
            {/* Grid lines */}
            <g className="stroke-muted opacity-20">
              {[0, 25, 50, 75, 100].map((percent) => {
                const y = padding.top + chartHeight * (1 - percent / 100);
                return (
                  <line
                    key={percent}
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    strokeWidth={1}
                  />
                );
              })}
            </g>

            {/* Area under curve */}
            <path
              d={areaPath}
              fill="hsl(var(--primary))"
              opacity={0.1}
            />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />

            {/* Data points */}
            {points.map((point, _index) => (
              <g key={point.entry.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill={getStatusColor(point.entry.status)}
                  className="cursor-pointer"
                >
                  <title>
                    {new Date(point.entry.recordedAt).toLocaleString()}
                    {"\n"}Status: {point.entry.status}
                    {"\n"}Latency: {point.entry.latencyMs}ms
                    {point.entry.errorMessage
                      ? `\nError: ${point.entry.errorMessage}`
                      : ""}
                  </title>
                </circle>
              </g>
            ))}

            {/* Y-axis labels */}
            <g className="fill-muted-foreground text-xs">
              {[0, 25, 50, 75, 100].map((percent) => {
                const y = padding.top + chartHeight * (1 - percent / 100);
                const value = Math.round((maxLatency * percent) / 100);
                return (
                  <text
                    key={percent}
                    x={padding.left - 10}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {value}ms
                  </text>
                );
              })}
            </g>

            {/* X-axis label */}
            <text
              x={width / 2}
              y={height - 5}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              Time
            </text>
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
              <span>Degraded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-5))" }} />
              <span>Down</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
