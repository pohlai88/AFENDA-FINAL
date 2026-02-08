"use client";

/**
 * Enhanced Quick Actions Card with Machina Recommendations
 * Displays quick actions with intelligent scoring and recommendations.
 */

import * as React from "react";
import {
  IconSettings,
  IconLock,
  IconSparkles,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@afenda/shadcn";

import { useUser } from "@/app/_components/user-context";
import { routes } from "@afenda/shared/constants";
import { CardHelpTooltip } from "./CardHelpTooltip";
import { DASHBOARD_HELP_CONTENT } from "./helpContent";
import { useActionRecommendations } from "./MachinaRecommendationEngine";
import { ALL_ACTIONS } from "./quickActions";

export function EnhancedQuickActionsCard({
  systemHealth,
  recentAudit,
}: {
  systemHealth: {
    summary?: {
      degraded?: number;
      down?: number;
    };
    status?: string;
  } | null;
  recentAudit: Array<{
    eventType: string;
    id: string;
  }>;
}) {
  const { user, isLoading } = useUser();
  const isAdmin = user?.role === "admin";

  // Get machina recommendations
  const recommendations = useActionRecommendations(ALL_ACTIONS, systemHealth, recentAudit);

  // Filter actions based on user role
  const availableActions = React.useMemo(() => {
    return ALL_ACTIONS.filter((action) => {
      if (action.adminOnly && !isAdmin) return false;
      return true;
    });
  }, [isAdmin]);

  // Get top 6 recommended actions
  const recommendedActions = React.useMemo(() => {
    const scored = availableActions.map(action => {
      const recommendation = recommendations.find(r => r.actionId === action.id);
      return {
        ...action,
        score: recommendation?.score || 0,
        reasons: recommendation?.reasons || [],
        priority: recommendation?.priority || "low",
      };
    }).sort((a, b) => b.score - a.score);

    return scored.slice(0, 6);
  }, [availableActions, recommendations]);

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardHelpTooltip content={DASHBOARD_HELP_CONTENT["quick-actions"]} />
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Loading recommendations...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state for non-authenticated users
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardHelpTooltip content={DASHBOARD_HELP_CONTENT["quick-actions"]} />
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Authentication required</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconLock className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium mb-2">Sign In Required</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Please sign in to access personalized quick actions.
            </p>
            <Button variant="outline" asChild>
              <a href={routes.ui.auth.login()}>
                Sign In
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no actions available
  if (availableActions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardHelpTooltip content={DASHBOARD_HELP_CONTENT["quick-actions"]} />
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>No actions available</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconSettings className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium mb-2">No Actions Available</h3>
            <p className="text-xs text-muted-foreground">
              No quick actions are available for your current role.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardHelpTooltip content={DASHBOARD_HELP_CONTENT["quick-actions"]} />
          <div>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              {isAdmin ? "Recommended administrative tasks" : "Frequently used actions"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {recommendedActions.map((action) => {
            const Icon = action.icon;

            return (
              <div key={action.id} className="relative">
                <Button
                  variant="outline"
                  className="h-24 w-full flex flex-col items-center justify-center p-3 gap-1 group"
                  asChild
                >
                  <a href={action.href}>
                    <Icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-xs font-medium text-center">{action.label}</span>
                    {action.reasons.length > 0 && (
                      <span className="text-[10px] text-muted-foreground text-center line-clamp-1">
                        {action.reasons[0]}
                      </span>
                    )}
                  </a>
                </Button>
                {/* Always show priority badge for HIGH priority */}
                {action.priority === "high" && (
                  <Badge
                    variant="destructive"
                    className="badge-top-right font-bold"
                  >
                    ⭐ HIGH
                  </Badge>
                )}
                {action.priority === "medium" && action.score > 60 && (
                  <Badge
                    variant="default"
                    className="badge-top-right font-semibold"
                  >
                    MEDIUM
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        {recommendations.some(r => r.score > 70) && (
          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
            <IconSparkles className="inline h-3 w-3 mr-1" />
            Actions powered by Machina (the invisible machine) based on your usage patterns
          </div>
        )}
      </CardContent>
    </Card>
  );
}
