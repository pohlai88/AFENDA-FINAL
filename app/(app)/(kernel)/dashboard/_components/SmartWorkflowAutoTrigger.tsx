"use client";

/**
 * Smart Workflow Auto-Trigger System
 * Automatically shows contextual workflows when system detects issues
 * Steve Jobs Philosophy: Anticipate user needs before they ask
 * 
 * @domain app
 * @layer component
 */

import * as React from "react";
import { IconAlertTriangle, IconX, IconPlayerPlay } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@afenda/shadcn";
import { ContextualMiniWorkflow, createConfigBackupWorkflow, createServiceRestartWorkflow } from "./ContextualMiniWorkflow";
import type { MiniWorkflow } from "./ContextualMiniWorkflow";

interface SmartWorkflowAutoTriggerProps {
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
}

/**
 * Smart Workflow Auto-Trigger Component (Optimized with React.memo)
 * 
 * Monitors system state and automatically suggests/starts workflows
 * - Service down → Suggest restart workflow
 * - High error rate → Suggest diagnostic workflow
 * - No recent backup → Suggest backup workflow
 */
const SmartWorkflowAutoTriggerComponent = ({
  systemHealth,
  recentAudit,
}: SmartWorkflowAutoTriggerProps) => {
  const [triggeredWorkflow, setTriggeredWorkflow] = React.useState<MiniWorkflow | null>(null);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [hasAutoStarted, setHasAutoStarted] = React.useState(false);

  // Create workflows on client side (can't be passed from server)
  const availableWorkflows = React.useMemo(() => [
    createConfigBackupWorkflow(),
    createServiceRestartWorkflow("Critical Service"),
  ], []);

  // Analyze system state and determine if workflow should trigger
  const suggestedWorkflow = React.useMemo(() => {
    // Critical: Services down - IMMEDIATE action needed
    if (systemHealth?.summary?.down && systemHealth.summary.down > 0) {
      const restartWorkflow = availableWorkflows.find(w => 
        w.id.includes("restart") || w.id.includes("recovery")
      );
      if (restartWorkflow) {
        return { workflow: restartWorkflow, reason: "Services are down", severity: "critical" as const };
      }
    }

    // High: Services degraded
    if (systemHealth?.summary?.degraded && systemHealth.summary.degraded > 0) {
      const diagnosticWorkflow = availableWorkflows.find(w => 
        w.id.includes("diagnostic") || w.id.includes("troubleshoot")
      );
      if (diagnosticWorkflow) {
        return { workflow: diagnosticWorkflow, reason: "Performance degradation detected", severity: "high" as const };
      }
    }

    // Medium: High error rate
    const recentErrors = recentAudit.filter(a => 
      a.eventType.includes("error") || a.eventType.includes("failure")
    );
    if (recentErrors.length > 5) {
      const auditWorkflow = availableWorkflows.find(w => 
        w.id.includes("audit") || w.id.includes("investigation")
      );
      if (auditWorkflow) {
        return { workflow: auditWorkflow, reason: "High error rate detected", severity: "medium" as const };
      }
    }

    return null;
  }, [systemHealth, recentAudit, availableWorkflows]);

  // Auto-trigger workflow when detected (only once per session)
  React.useEffect(() => {
    if (suggestedWorkflow && !isDismissed && !triggeredWorkflow && !hasAutoStarted) {
      // Critical severity: Auto-show immediately
      if (suggestedWorkflow.severity === "critical") {
        setTriggeredWorkflow(suggestedWorkflow.workflow);
      }
    }
  }, [suggestedWorkflow, isDismissed, triggeredWorkflow, hasAutoStarted]);

  // Don't show if dismissed or no suggestion
  if (isDismissed || !suggestedWorkflow) {
    return null;
  }

  // Show suggested workflow if not triggered
  if (!triggeredWorkflow) {
    const severityBadgeVariant = 
      suggestedWorkflow.severity === "critical" ? "destructive" :
      suggestedWorkflow.severity === "high" ? "default" :
      "secondary";

    const borderColorToken =
      suggestedWorkflow.severity === "critical" ? "var(--badge-critical)" :
      suggestedWorkflow.severity === "high" ? "var(--badge-warning)" :
      "var(--badge-info)";
    return (
      <Card className="fixed top-20 right-6 z-40 w-96 shadow-2xl border-l-4" 
            style={{ borderLeftColor: borderColorToken }}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className={`h-5 w-5 ${
                suggestedWorkflow.severity === "critical" ? "text-red-500 animate-pulse" :
                suggestedWorkflow.severity === "high" ? "text-orange-500" :
                "text-blue-500"
              }`} />
              <div>
                <CardTitle className="text-base">Action Recommended</CardTitle>
                <CardDescription className="text-xs">
                  {suggestedWorkflow.reason}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-1">
              <Badge variant={severityBadgeVariant}>
                {suggestedWorkflow.severity}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsDismissed(true)}
                aria-label="Dismiss"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-start gap-2">
              <suggestedWorkflow.workflow.icon className="h-5 w-5 text-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold mb-1">{suggestedWorkflow.workflow.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{suggestedWorkflow.workflow.description}</p>
                <div className="text-xs text-muted-foreground">
                  {suggestedWorkflow.workflow.steps.length} steps • Automated
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              onClick={() => {
                setTriggeredWorkflow(suggestedWorkflow.workflow);
                setHasAutoStarted(true);
              }}
            >
              <IconPlayerPlay className="mr-2 h-4 w-4" />
              Start Workflow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDismissed(true)}
            >
              Later
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Suggested by Machina based on system health
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show running workflow
  return (
    <div className="fixed top-20 right-6 z-40 w-96">
      <ContextualMiniWorkflow
        workflow={triggeredWorkflow}
        compact={false}
      />
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 w-7 p-0"
        onClick={() => {
          setTriggeredWorkflow(null);
          setIsDismissed(true);
        }}
        aria-label="Close"
      >
        <IconX className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Export memoized component for performance optimization
export const SmartWorkflowAutoTrigger = React.memo(SmartWorkflowAutoTriggerComponent);
SmartWorkflowAutoTrigger.displayName = "SmartWorkflowAutoTrigger";
