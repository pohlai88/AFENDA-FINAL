"use client";

/**
 * Interactive Metric Drill-Down Component
 * Provides detailed analysis when clicking on dashboard metrics.
 */

import * as React from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogHeader,
  ClientDialogTitle,
} from "@afenda/shadcn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn";
import { Badge } from "@afenda/shadcn";
import { Progress } from "@afenda/shadcn";
import { CardHelpTooltip, type HelpContent } from "./CardHelpTooltip";
import { getTrendColor } from "./colorUtils";

export interface MetricDetail {
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  historicalData: Array<{ timestamp: Date; value: number }>;
  relatedMetrics: Array<{
    name: string;
    value: number;
    unit: string;
  }>;
  alerts: Array<{
    level: "info" | "warning" | "error";
    message: string;
    timestamp: Date;
  }>;
}

export interface InteractiveMetricProps {
  title: string;
  value: string | number;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  detailData?: MetricDetail;
  helpContent?: HelpContent;
  children?: React.ReactNode;
}

export function InteractiveMetric({
  title,
  value,
  description: _description,
  badge,
  badgeVariant,
  detailData,
  helpContent,
  children,
}: InteractiveMetricProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <>
      <Card
        className="relative cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
        onClick={() => setIsDialogOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsDialogOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${title}: ${value}`}
        aria-pressed={isDialogOpen}
      >
        {badge && (
          <Badge variant={badgeVariant} className="absolute top-3 right-3">
            {badge}
          </Badge>
        )}
        <CardHeader className="space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {helpContent && <CardHelpTooltip content={helpContent} />}
            <CardDescription>{title}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-2xl font-bold tabular-nums">
            {value}
          </CardTitle>
          {children}
        </CardContent>
      </Card>

      <ClientDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ClientDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <ClientDialogHeader>
            <ClientDialogTitle className="flex items-center gap-2">
              {title} - Detailed Analysis
            </ClientDialogTitle>
            <ClientDialogDescription>
              Comprehensive breakdown and historical trends for {title.toLowerCase()}
            </ClientDialogDescription>
          </ClientDialogHeader>

          {detailData && (
            <div className="space-y-6">
              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-2xl font-bold">{detailData.currentValue}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Previous Value</p>
                      <p className="text-2xl font-bold">{detailData.previousValue}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Change</p>
                      <p className={`text-2xl font-bold flex items-center gap-1 ${getTrendColor(detailData.trend)}`}>
                        {detailData.trend === "up" && <IconTrendingUp className="h-5 w-5" />}
                        {detailData.trend === "down" && <IconTrendingDown className="h-5 w-5" />}
                        {detailData.change > 0 ? "+" : ""}{detailData.change}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Change %</p>
                      <p className={`text-2xl font-bold ${detailData.changePercent > 0 ? getTrendColor("up") :
                        detailData.changePercent < 0 ? getTrendColor("down") : getTrendColor("stable")
                        }`}>
                        {detailData.changePercent > 0 ? "+" : ""}{detailData.changePercent}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">24-Hour Trend</CardTitle>
                  <CardDescription>
                    Values over the last 24 hours with hourly averages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {detailData.historicalData.slice(-12).map((data, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground w-20">
                          {data.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="flex-1 mx-4">
                          <Progress
                            value={(data.value / Math.max(...detailData.historicalData.map(d => d.value))) * 100}
                            className="h-2"
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {data.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Related Metrics */}
              {detailData.relatedMetrics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Metrics</CardTitle>
                    <CardDescription>
                      Other metrics that may influence this value
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {detailData.relatedMetrics.map((metric, index) => (
                        <div key={index} className="text-center p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">{metric.name}</p>
                          <p className="text-xl font-bold">{metric.value}</p>
                          <p className="text-xs text-muted-foreground">{metric.unit}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Alerts */}
              {detailData.alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Alerts</CardTitle>
                    <CardDescription>
                      Notifications and warnings related to this metric
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detailData.alerts.map((alert, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <Badge variant={
                            alert.level === "error" ? "destructive" :
                              alert.level === "warning" ? "default" : "secondary"
                          }>
                            {alert.level}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {alert.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </ClientDialogContent>
      </ClientDialog>
    </>
  );
}
