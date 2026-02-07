"use client";

/**
 * Audit Volume Timeline
 * Timeline showing audit event volume over time.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@afenda/shadcn";

interface VolumeData {
  hour: string;
  events: number;
  type: "normal" | "high" | "critical";
}

export function AuditVolumeTimeline() {
  const [data, setData] = React.useState<VolumeData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Mock audit volume data for last 12 hours
        const mockData: VolumeData[] = [
          { hour: "12am", events: 45, type: "normal" },
          { hour: "2am", events: 32, type: "normal" },
          { hour: "4am", events: 28, type: "normal" },
          { hour: "6am", events: 67, type: "normal" },
          { hour: "8am", events: 120, type: "high" },
          { hour: "10am", events: 145, type: "high" },
          { hour: "12pm", events: 98, type: "normal" },
          { hour: "2pm", events: 156, type: "high" },
          { hour: "4pm", events: 89, type: "normal" },
          { hour: "6pm", events: 54, type: "normal" },
          { hour: "8pm", events: 41, type: "normal" },
          { hour: "10pm", events: 38, type: "normal" },
        ];

        setData(mockData);
      } catch (error) {
        console.error("Failed to fetch audit volume:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Event Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const maxEvents = Math.max(...data.map((d) => d.events));
  const totalEvents = data.reduce((sum, d) => sum + d.events, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Audit Event Volume (Last 12h)</CardTitle>
          <Badge variant="outline">{totalEvents} events</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 h-48">
          {data.map((item, index) => {
            const height = (item.events / maxEvents) * 100;
            const color = item.type === "critical" ? "bg-red-500" : item.type === "high" ? "bg-yellow-500" : "bg-blue-500";
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <div className="text-xs text-muted-foreground mb-1">{item.events}</div>
                  <div
                    className={`w-full ${color} rounded-t transition-all hover:opacity-80`}
                    style={{ height: `${height}%` }}
                    title={`${item.hour}: ${item.events} events`}
                  />
                </div>
                <div className="text-xs text-muted-foreground">{item.hour}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
