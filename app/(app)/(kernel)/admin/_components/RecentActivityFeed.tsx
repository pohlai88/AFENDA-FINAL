"use client";

/**
 * Recent Activity Feed
 * Shows recent activity across all modules (config, audit, health, backup).
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@afenda/shadcn";

interface Activity {
  id: string;
  type: "config" | "audit" | "health" | "backup";
  action: string;
  description: string;
  user: string;
  timestamp: Date | string;
  href?: string;
}

interface RecentActivityFeedProps {
  maxItems?: number;
}

function formatRelativeTime(date: Date | string): string {
  const timestamp = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return timestamp.toLocaleDateString();
}

function getActivityIcon(type: string): string {
  switch (type) {
    case "config": return "⚙️";
    case "audit": return "📋";
    case "health": return "❤️";
    case "backup": return "💾";
    default: return "📌";
  }
}

function getActivityColor(type: string): string {
  switch (type) {
    case "config": return "bg-blue-500";
    case "audit": return "bg-purple-500";
    case "health": return "bg-green-500";
    case "backup": return "bg-orange-500";
    default: return "bg-gray-500";
  }
}

export function RecentActivityFeed({ maxItems = 10 }: RecentActivityFeedProps) {
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        // Mock recent activities
        const mockActivities: Activity[] = [
          {
            id: "1",
            type: "config",
            action: "Updated",
            description: "global.feature.enabled",
            user: "admin@example.com",
            timestamp: new Date(Date.now() - 300000),
            href: "/admin/config",
          },
          {
            id: "2",
            type: "audit",
            action: "Reviewed",
            description: "Security audit logs",
            user: "admin@example.com",
            timestamp: new Date(Date.now() - 1800000),
            href: "/admin/audit",
          },
          {
            id: "3",
            type: "health",
            action: "Checked",
            description: "System health status",
            user: "admin@example.com",
            timestamp: new Date(Date.now() - 3600000),
            href: "/admin/health",
          },
          {
            id: "4",
            type: "backup",
            action: "Created",
            description: "Full system backup",
            user: "system",
            timestamp: new Date(Date.now() - 7200000),
            href: "/admin/backup",
          },
          {
            id: "5",
            type: "config",
            action: "Created",
            description: "app.timeout.seconds",
            user: "admin@example.com",
            timestamp: new Date(Date.now() - 10800000),
            href: "/admin/config",
          },
        ];

        setActivities(mockActivities.slice(0, maxItems));
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [maxItems]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const content = (
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className={`size-10 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white shrink-0`}>
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{activity.action}</span>
                    <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            );

            return activity.href ? (
              <Link key={activity.id} href={activity.href}>
                {content}
              </Link>
            ) : (
              <div key={activity.id}>{content}</div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
