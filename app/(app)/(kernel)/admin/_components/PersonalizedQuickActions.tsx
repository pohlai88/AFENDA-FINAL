"use client";

/**
 * Personalized Quick Actions
 * User-specific quick actions based on usage history and role.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  category: "frequent" | "recent" | "recommended";
  usageCount?: number;
  lastUsed?: Date | string;
}

interface PersonalizedQuickActionsProps {
  userId?: string;
  maxActions?: number;
}

/**
 * Get icon emoji for action category.
 */
function getCategoryIcon(category: string): string {
  switch (category) {
    case "frequent":
      return "⭐";
    case "recent":
      return "🕐";
    case "recommended":
      return "💡";
    default:
      return "📌";
  }
}

/**
 * Format relative time.
 */
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

export function PersonalizedQuickActions({ userId, maxActions = 6 }: PersonalizedQuickActionsProps) {
  const [actions, setActions] = React.useState<QuickAction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPersonalizedActions = async () => {
      setIsLoading(true);

      try {
        // In production, fetch from API based on user history
        // const response = await fetch(routes.api.orchestra.userActions(userId));
        // const data = await response.json();

        // Mock personalized actions based on usage patterns
        const mockActions: QuickAction[] = [
          {
            id: "1",
            title: "View Configurations",
            description: "Most frequently accessed",
            href: routes.ui.admin.config(),
            icon: "⚙️",
            category: "frequent",
            usageCount: 45,
            lastUsed: new Date(Date.now() - 3600000), // 1 hour ago
          },
          {
            id: "2",
            title: "Check System Health",
            description: "Recently viewed",
            href: routes.ui.admin.health(),
            icon: "❤️",
            category: "recent",
            lastUsed: new Date(Date.now() - 7200000), // 2 hours ago
          },
          {
            id: "3",
            title: "Review Audit Logs",
            description: "Frequently accessed",
            href: routes.ui.admin.audit(),
            icon: "📋",
            category: "frequent",
            usageCount: 32,
            lastUsed: new Date(Date.now() - 86400000), // 1 day ago
          },
          {
            id: "4",
            title: "Browse Templates",
            description: "Recommended for you",
            href: routes.ui.admin.configTemplates(),
            icon: "📄",
            category: "recommended",
          },
          {
            id: "5",
            title: "Manage Backups",
            description: "Recently accessed",
            href: routes.ui.admin.backup(),
            icon: "💾",
            category: "recent",
            lastUsed: new Date(Date.now() - 172800000), // 2 days ago
          },
          {
            id: "6",
            title: "Create New Config",
            description: "Recommended action",
            href: routes.ui.admin.config(),
            icon: "➕",
            category: "recommended",
          },
        ];

        setActions(mockActions.slice(0, maxActions));
      } catch (error) {
        console.error("Failed to fetch personalized actions:", error);
        // Fallback to default actions
        setActions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonalizedActions();
  }, [userId, maxActions]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No personalized actions available yet. Start using the system to see recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <Badge variant="outline" className="text-xs">
            Personalized
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="group block p-4 rounded-lg border bg-card hover:bg-accent transition-all duration-200 hover:shadow-sm"
            >
              {/* Category indicator */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl" title={action.category}>
                  {action.icon}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {getCategoryIcon(action.category)}
                </Badge>
              </div>

              {/* Title and description */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {action.description}
                </p>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
                {action.usageCount && (
                  <span className="flex items-center gap-1">
                    <span>Used {action.usageCount}x</span>
                  </span>
                )}
                {action.lastUsed && (
                  <>
                    {action.usageCount && <span>•</span>}
                    <span>{formatRelativeTime(action.lastUsed)}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
