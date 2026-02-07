"use client";

/**
 * SOS Workflow Visualizer Component
 * Shows user's current position in administrative workflows and provides step-by-step guidance.
 */

import * as React from "react";
import { IconCurrentLocation, IconCheck, IconAlertTriangle } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Progress,
} from "@afenda/shadcn";
import { getStatusColor } from "./colorUtils";

/** In-actual tour: teach on the real UI. Target the DOM element; hint tells user what to do (click, type, submit). */
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "current" | "pending" | "blocked";
  actionUrl?: string;
  estimatedTime?: string;
  dependencies?: string[];
  /** CSS selector for the real element to spotlight (e.g. [data-magic-tour="add-user"]). When set, tour highlights that element and asks user to act there. */
  targetSelector?: string;
  /** Hint for in-actual step: "click" | "type" | "submit". Shown as "Click here", "Enter value here", "Submit the form". */
  actionHint?: "click" | "type" | "submit";
  /** Optional: function to resolve target element dynamically. When set, overrides targetSelector. */
  targetResolver?: () => Element | null;
  /** Optional: align step with CRUD API (resource + action). Used to derive path→step from path→(resource, crud). */
  resource?: string;
  crudOp?: string;
}

/** Optional branching (Retool-style): fromStepId → toStepId with optional label. When absent, workflow is linear. */
export interface WorkflowNextStep {
  fromStepId: string;
  toStepId: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: WorkflowStep[];
  /** When set, magic-tour follows these paths instead of linear order. SOS unchanged. */
  nextSteps?: WorkflowNextStep[];
  progress: number; // 0-100
  priority: "low" | "medium" | "high" | "critical";
  isActive: boolean;
}

export interface SOSWorkflowVisualizerProps {
  workflows: Workflow[];
  currentWorkflowId?: string;
}

export function SOSWorkflowVisualizer({
  workflows,
  currentWorkflowId,
}: SOSWorkflowVisualizerProps) {
  const currentWorkflow = workflows.find(w => w.id === currentWorkflowId);

  // Handle workflow actions internally
  const handleStartWorkflow = React.useCallback((workflowId: string) => {
    // In a real implementation, this would update user state or navigate
  }, []);

  const handleResumeWorkflow = React.useCallback((workflowId: string, stepId: string) => {
    // In a real implementation, this would navigate to the appropriate page
  }, []);

  // Always show all workflows with their current state (past-present-future concept)

  return (
    <div className="space-y-4" role="region" aria-label="Workflow visualizer">
      {/* Current Workflow Focus */}
      {currentWorkflow && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <currentWorkflow.icon className="h-5 w-5" aria-hidden="true" />
                <CardTitle>Current: {currentWorkflow.name}</CardTitle>
                <Badge variant={getPriorityVariant(currentWorkflow.priority)}>
                  {currentWorkflow.priority}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentWorkflow.progress}% Complete
              </div>
            </div>
            <CardDescription>{currentWorkflow.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={currentWorkflow.progress} className="h-2" aria-label={`Workflow progress: ${currentWorkflow.progress}%`} />
              <WorkflowSteps
                steps={currentWorkflow.steps}
                onResumeStep={(stepId) => handleResumeWorkflow(currentWorkflow.id, stepId)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Workflows - Past, Present, Future */}
      {workflows
        .filter((w: Workflow) => w.id !== currentWorkflowId)
        .map((workflow: Workflow) => (
          <Card key={workflow.id} className="border-muted">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <workflow.icon className="h-5 w-5" />
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <Badge variant={getPriorityVariant(workflow.priority)}>
                    {workflow.priority}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {workflow.progress}% Complete
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={workflow.progress} className="h-1 mb-3" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartWorkflow(workflow.id)}
              >
                Resume Workflow
              </Button>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

function WorkflowSteps({
  steps,
  onResumeStep,
}: {
  steps: WorkflowStep[];
  onResumeStep?: (stepId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isCompleted = step.status === "completed";
        const isCurrent = step.status === "current";
        const isPending = step.status === "pending";
        const isBlocked = step.status === "blocked";

        return (
          <div
            key={step.id}
            className="flex items-start gap-3"
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${isCompleted ? "bg-chart-1 border-chart-1" : ""}
                  ${isCurrent ? "bg-primary border-primary" : ""}
                  ${isPending ? "bg-muted border-muted-foreground" : ""}
                  ${isBlocked ? "bg-destructive/10 border-destructive" : ""}
                `}
                aria-label={`Step ${index + 1}: ${step.status}`}
                role="img"
              >
                {isCompleted && <IconCheck className="h-4 w-4 text-white" />}
                {isCurrent && <IconCurrentLocation className="h-4 w-4 text-white" />}
                {isPending && <span className="text-xs text-muted-foreground">{index + 1}</span>}
                {isBlocked && <IconAlertTriangle className={`h-4 w-4 ${getStatusColor("error")}`} />}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-0.5 h-8 mt-1
                    ${isCompleted ? "bg-chart-1" : "bg-muted"}
                  `}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${isCurrent ? "text-primary" : ""}`}>
                  {step.title}
                </h4>
                {step.estimatedTime && (
                  <span className="text-xs text-muted-foreground">{step.estimatedTime}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
              {isCurrent && step.actionUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResumeStep?.(step.id)}
                >
                  Continue
                </Button>
              )}
              {isBlocked && step.dependencies && (
                <div className={`text-xs ${getStatusColor("error")}`}>
                  Blocked by: {step.dependencies.join(", ")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getPriorityVariant(priority: string) {
  switch (priority) {
    case "critical":
      return "destructive";
    case "high":
      return "default";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
}
