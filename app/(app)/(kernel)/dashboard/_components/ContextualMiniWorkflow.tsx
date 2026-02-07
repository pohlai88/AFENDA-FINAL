"use client";

/**
 * Contextual Mini-Workflows Component
 * Embed mini-workflows directly in dashboard cards for immediate action.
 */

import * as React from "react";
import { IconPlayerPlay, IconCheck, IconX, IconLoader2, IconRefresh } from "@tabler/icons-react";
import { Button } from "@afenda/shadcn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn";
import { Progress } from "@afenda/shadcn";
import { Badge } from "@afenda/shadcn";
import { getStatusColor } from "./colorUtils";

export interface MiniWorkflowStep {
  id: string;
  title: string;
  description: string;
  action: () => Promise<boolean>; // Returns true if successful
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

export interface MiniWorkflow {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: MiniWorkflowStep[];
  isRunning: boolean;
  onComplete?: (success: boolean) => void;
}

export interface ContextualMiniWorkflowProps {
  workflow: MiniWorkflow;
  compact?: boolean;
}

export function ContextualMiniWorkflow({
  workflow,
  compact = false
}: ContextualMiniWorkflowProps) {
  const [currentWorkflow, setCurrentWorkflow] = React.useState(workflow);

  const startWorkflow = React.useCallback(async () => {
    setCurrentWorkflow(prev => ({ ...prev, isRunning: true }));

    for (let i = 0; i < currentWorkflow.steps.length; i++) {
      const step = currentWorkflow.steps[i];

      // Update step to running
      setCurrentWorkflow(prev => ({
        ...prev,
        steps: prev.steps.map((s, idx) =>
          idx === i ? { ...s, status: "running" as const } : s
        )
      }));

      try {
        // Execute step action
        const success = await step.action();

        // Update step status
        setCurrentWorkflow(prev => ({
          ...prev,
          steps: prev.steps.map((s, idx) =>
            idx === i
              ? { ...s, status: success ? "completed" as const : "failed" as const }
              : s
          )
        }));

        // If step failed, stop workflow
        if (!success) {
          break;
        }
      } catch (error) {
        // Update step with error
        setCurrentWorkflow(prev => ({
          ...prev,
          steps: prev.steps.map((s, idx) =>
            idx === i
              ? { ...s, status: "failed" as const, error: error instanceof Error ? error.message : "Unknown error" }
              : s
          )
        }));
        break;
      }
    }

    // Mark workflow as complete
    setCurrentWorkflow(prev => ({ ...prev, isRunning: false }));

    // Check if all steps completed successfully
    const allSuccessful = currentWorkflow.steps.every(s => s.status === "completed");
    workflow.onComplete?.(allSuccessful);
  }, [currentWorkflow.steps, workflow]);

  const resetWorkflow = React.useCallback(() => {
    setCurrentWorkflow(prev => ({
      ...prev,
      isRunning: false,
      steps: prev.steps.map(step => ({ ...step, status: "pending" as const, error: undefined }))
    }));
  }, []);

  const completedSteps = currentWorkflow.steps.filter(s => s.status === "completed").length;
  const progress = (completedSteps / currentWorkflow.steps.length) * 100;

  if (compact) {
    return (
      <div className="p-4 border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <workflow.icon className="h-4 w-4" />
            <span className="font-medium text-sm">{workflow.title}</span>
          </div>
          {!currentWorkflow.isRunning && (
            <Button size="sm" onClick={startWorkflow}>
              <IconPlayerPlay className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}
        </div>
        {currentWorkflow.isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="h-1" />
            <p className="text-xs text-muted-foreground">
              Step {completedSteps + 1} of {currentWorkflow.steps.length}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <workflow.icon className="h-5 w-5" />
            <CardTitle className="text-lg">{workflow.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {currentWorkflow.isRunning && (
              <Badge variant="secondary">
                <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />
                Running
              </Badge>
            )}
            {!currentWorkflow.isRunning && completedSteps > 0 && (
              <Button size="sm" variant="outline" onClick={resetWorkflow}>
                <IconRefresh className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
        <CardDescription>{workflow.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!currentWorkflow.isRunning && completedSteps === 0 && (
          <div className="text-center py-6">
            <Button onClick={startWorkflow}>
              <IconPlayerPlay className="h-4 w-4 mr-2" />
              Start Workflow
            </Button>
          </div>
        )}

        {(currentWorkflow.isRunning || completedSteps > 0) && (
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-muted-foreground">
              {completedSteps} of {currentWorkflow.steps.length} steps completed
            </div>

            <div className="space-y-3">
              {currentWorkflow.steps.map((step, index) => {
                const isCompleted = step.status === "completed";
                const isRunning = step.status === "running";
                const isFailed = step.status === "failed";

                return (
                  <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 mt-0.5">
                      {isCompleted && <IconCheck className={`h-3 w-3 ${getStatusColor("success")}`} />}
                      {isRunning && <IconLoader2 className={`h-3 w-3 animate-spin ${getStatusColor("info")}`} />}
                      {isFailed && <IconX className={`h-3 w-3 ${getStatusColor("error")}`} />}
                      {step.status === "pending" && (
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{step.title}</h4>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                      {isFailed && step.error && (
                        <p className={`text-xs ${getStatusColor("error")} mt-1`}>{step.error}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Predefined mini-workflows for common tasks
 */
export const createServiceRestartWorkflow = (serviceName: string): MiniWorkflow => ({
  id: `restart-${serviceName}`,
  title: `Restart ${serviceName}`,
  description: `Gracefully restart the ${serviceName} service`,
  icon: IconRefresh,
  isRunning: false,
  steps: [
    {
      id: "check-status",
      title: "Check Service Status",
      description: "Verify current service status before restart",
      status: "pending",
      action: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      },
    },
    {
      id: "graceful-stop",
      title: "Graceful Stop",
      description: "Send graceful stop signal to the service",
      status: "pending",
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      },
    },
    {
      id: "wait-stop",
      title: "Wait for Stop",
      description: "Wait for service to fully stop",
      status: "pending",
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return true;
      },
    },
    {
      id: "start-service",
      title: "Start Service",
      description: "Start the service again",
      status: "pending",
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      },
    },
    {
      id: "verify-health",
      title: "Verify Health",
      description: "Confirm service is healthy after restart",
      status: "pending",
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      },
    },
  ],
});

export const createConfigBackupWorkflow = (): MiniWorkflow => ({
  id: "config-backup",
  title: "Backup Configuration",
  description: "Create a backup of current system configuration",
  icon: IconRefresh,
  isRunning: false,
  steps: [
    {
      id: "validate-config",
      title: "Validate Configuration",
      description: "Check if current configuration is valid",
      status: "pending",
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      },
    },
    {
      id: "create-backup",
      title: "Create Backup",
      description: "Generate configuration backup file",
      status: "pending",
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return true;
      },
    },
    {
      id: "verify-backup",
      title: "Verify Backup",
      description: "Verify backup integrity",
      status: "pending",
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      },
    },
  ],
});
