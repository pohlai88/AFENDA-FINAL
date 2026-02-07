"use client";

/**
 * Machina Recommendation Panel
 * The invisible machine revolution – suggested actions from system health and usage.
 * Steve Jobs Philosophy: Make the next right action obvious
 *
 * @domain app
 * @layer component
 */

import * as React from "react";
import { IconSparkles, IconX, IconChevronDown, IconChevronUp, IconRocket } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@afenda/shadcn";
import { useActionRecommendations } from "./MachinaRecommendationEngine";
import { ALL_ACTIONS } from "./quickActions";
import type { QuickAction } from "./types";

interface MachinaRecommendationPanelProps {
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
  mode?: "active" | "passive";
  /** When true, panel opens (e.g. from FAB or ?machina=1) and shows even with 0 recommendations */
  openFromExternal?: boolean;
}

/**
 * Machina Recommendation Panel – the invisible machine revolution (React.memo)
 *
 * Active Mode: Shows immediately when critical recommendations exist
 * Passive Mode: Shows as a pulsing badge until user opens it
 * openFromExternal: Opens from FAB or ?machina=1, shows even with 0 recommendations
 */
const MachinaRecommendationPanelComponent = ({
  systemHealth,
  recentAudit,
  mode = "active",
  openFromExternal = false,
}: MachinaRecommendationPanelProps) => {
  const [isOpen, setIsOpen] = React.useState(openFromExternal);
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Use ALL_ACTIONS from client-side import (can't pass React components from server)
  const recommendations = useActionRecommendations(ALL_ACTIONS, systemHealth, recentAudit);

  // Get high-priority recommendations
  const criticalRecommendations = React.useMemo(() => {
    return recommendations.filter(r => r.priority === "high" && r.score >= 80);
  }, [recommendations]);

  const hasUrgentActions = criticalRecommendations.length > 0;

  // Top 3 recommendations (must be before early returns per Rules of Hooks)
  const topRecommendations = React.useMemo(() => {
    return recommendations.slice(0, 3).map(rec => {
      const action = ALL_ACTIONS.find(a => a.id === rec.actionId);
      return { ...rec, action };
    }).filter(r => r.action);
  }, [recommendations]);

  // Open when requested from FAB or ?machina=1
  React.useEffect(() => {
    if (openFromExternal) setIsOpen(true);
  }, [openFromExternal]);

  // Auto-open in active mode when critical recommendations exist
  React.useEffect(() => {
    if (mode === "active" && hasUrgentActions && !isDismissed) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, hasUrgentActions, isDismissed]);

  // Don't show if dismissed or not open; show when openFromExternal even with 0 recommendations
  const showPanel = openFromExternal || recommendations.length > 0;
  if (isDismissed || !showPanel || !isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 max-w-sm shadow-2xl border-primary/50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <IconSparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Machina</CardTitle>
              <CardDescription className="text-xs">
                {hasUrgentActions ? "Urgent recommendations" : "The invisible machine — suggested actions"}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize"
            >
              <IconChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                setIsOpen(false);
                setIsDismissed(true);
              }}
              aria-label="Dismiss"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {topRecommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No suggestions right now. Machina will recommend actions based on system health and usage.
          </p>
        ) : null}
        {topRecommendations.map((rec) => {
          if (!rec.action) return null;

          const Icon = rec.action.icon;
          const priorityBadgeVariant = 
            rec.priority === "high" ? "destructive" :
            rec.priority === "medium" ? "default" :
            "secondary";

          return (
            <div
              key={rec.actionId}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group cursor-pointer"
              onClick={() => {
                window.location.href = rec.action!.href;
              }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold">{rec.action.label}</h4>
                    <Badge variant={priorityBadgeVariant} className="text-[10px] px-1.5 py-0">
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {rec.action.description}
                  </p>
                  {rec.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rec.reasons.slice(0, 2).map((reason, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                        >
                          <IconRocket className="h-3 w-3" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 text-center">
          <p className="text-[10px] text-muted-foreground">
            The invisible machine — system health, usage patterns, and time of day
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Export memoized component for performance optimization
export const MachinaRecommendationPanel = React.memo(MachinaRecommendationPanelComponent);
MachinaRecommendationPanel.displayName = "MachinaRecommendationPanel";
