"use client";

/**
 * SOS "Where Am I?" Workflow Trigger
 * Shows contextual workflow position and next steps on demand
 * Steve Jobs Philosophy: Always let users know where they are
 * 
 * @domain app
 * @layer component
 */

import * as React from "react";
import { IconCurrentLocation, IconX, IconChevronRight, IconCheck } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
} from "@afenda/shadcn";
import type { Workflow } from "./SOSWorkflowVisualizer";

interface SOSWorkflowTriggerProps {
  workflows: Workflow[];
  currentWorkflowId?: string;
}

/**
 * SOS Workflow Trigger Component (Optimized with React.memo) - "Where Am I?" Button
 * 
 * Invisible until needed, triggered by user or system
 * Shows: Current location in workflow + Next recommended action
 */
const SOSWorkflowTriggerComponent = ({
  workflows,
  currentWorkflowId,
}: SOSWorkflowTriggerProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Find active workflows (workflows that have been started)
  const activeWorkflows = React.useMemo(() => {
    return workflows.filter(w => w.progress > 0 && w.progress < 100);
  }, [workflows]);

  // Find current workflow or most recent active workflow
  const contextualWorkflow = React.useMemo(() => {
    if (currentWorkflowId) {
      return workflows.find(w => w.id === currentWorkflowId);
    }
    // Return highest priority active workflow
    return activeWorkflows.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })[0];
  }, [currentWorkflowId, workflows, activeWorkflows]);

  // Get next action from workflow
  const nextAction = React.useMemo(() => {
    if (!contextualWorkflow) return null;
    return contextualWorkflow.steps.find(s => s.status === "current" || s.status === "pending");
  }, [contextualWorkflow]);

  // Don't show trigger if no workflows
  if (workflows.length === 0) {
    return null;
  }

  // Trigger button when closed
  if (!isOpen) {
    const hasActiveWorkflow = !!contextualWorkflow && contextualWorkflow.progress > 0;
    
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="sos-trigger group"
        aria-label="Where am I? Show workflow position"
        title="Where Am I?"
      >
        <IconCurrentLocation 
          className={`h-5 w-5 ${hasActiveWorkflow ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}
        />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-24 z-40 w-96 shadow-2xl border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <IconCurrentLocation className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Where Am I?</CardTitle>
              <CardDescription className="text-xs">
                Current workflow position
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!contextualWorkflow ? (
          <div className="text-center py-6">
            <IconCurrentLocation className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-medium mb-1">No Active Workflows</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Start a workflow to see your progress here
            </p>
            {workflows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium mb-2">Available Workflows:</p>
                {workflows.slice(0, 3).map(w => {
                  const Icon = w.icon;
                  return (
                    <Button
                      key={w.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        // Navigate to workflow
                        setIsOpen(false);
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{w.name}</span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Current Workflow Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <contextualWorkflow.icon className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">{contextualWorkflow.name}</h3>
                  <p className="text-xs text-muted-foreground">{contextualWorkflow.description}</p>
                </div>
                <Badge 
                  variant={
                    contextualWorkflow.priority === "critical" ? "destructive" :
                    contextualWorkflow.priority === "high" ? "default" :
                    contextualWorkflow.priority === "medium" ? "secondary" :
                    "outline"
                  }
                >
                  {contextualWorkflow.priority}
                </Badge>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{contextualWorkflow.progress}%</span>
                </div>
                <Progress value={contextualWorkflow.progress} className="h-2" />
              </div>
            </div>

            {/* Current Step + Next Action */}
            {nextAction && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2 mb-2">
                  <IconChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold mb-1">
                      {nextAction.status === "current" ? "Current Step" : "Next Step"}
                    </h4>
                    <p className="text-xs font-medium mb-1">{nextAction.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{nextAction.description}</p>
                    {nextAction.estimatedTime && (
                      <p className="text-[10px] text-muted-foreground">
                        ⏱️ Est. {nextAction.estimatedTime}
                      </p>
                    )}
                  </div>
                </div>
                {nextAction.actionUrl && (
                  <Button
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <a href={nextAction.actionUrl}>
                      Start This Step
                      <IconChevronRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Mini Step List */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">All Steps:</p>
              {contextualWorkflow.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 p-2 rounded text-xs ${
                    step.status === "current" ? "bg-primary/10 border border-primary/30" :
                    step.status === "completed" ? "opacity-60" :
                    "opacity-40"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                    step.status === "completed" ? "bg-green-500" :
                    step.status === "current" ? "bg-primary" :
                    step.status === "blocked" ? "bg-red-500" :
                    "bg-muted"
                  }`}>
                    {step.status === "completed" ? (
                      <IconCheck className="h-3 w-3 text-white" />
                    ) : (
                      <span className="text-[10px] text-white font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span className={`flex-1 ${step.status === "current" ? "font-medium" : ""}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Export memoized component for performance optimization
export const SOSWorkflowTrigger = React.memo(SOSWorkflowTriggerComponent);
SOSWorkflowTrigger.displayName = "SOSWorkflowTrigger";
