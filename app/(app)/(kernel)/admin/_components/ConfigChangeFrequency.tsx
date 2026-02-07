"use client";

/**
 * Config Change Frequency
 * Graph showing configuration change frequency over time.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn";

interface ChangeData {
  date: string;
  count: number;
}

export function ConfigChangeFrequency() {
  const [data, setData] = React.useState<ChangeData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Mock change frequency data for last 7 days
        const mockData: ChangeData[] = [
          { date: "Mon", count: 12 },
          { date: "Tue", count: 8 },
          { date: "Wed", count: 15 },
          { date: "Thu", count: 6 },
          { date: "Fri", count: 20 },
          { date: "Sat", count: 3 },
          { date: "Sun", count: 5 },
        ];

        setData(mockData);
      } catch (error) {
        console.error("Failed to fetch change frequency:", error);
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
          <CardTitle className="text-base">Config Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Config Changes (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-48">
          {data.map((item, index) => {
            const height = (item.count / maxCount) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <div className="text-xs text-muted-foreground mb-1">{item.count}</div>
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">{item.date}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
