"use client";

/**
 * SOS Workflow Panel
 * Full workflow position panel (without the trigger button)
 * Used by ContextualHelper to show workflow status
 * 
 * @domain app
 * @layer component
 */

import * as React from "react";
import { IconCurrentLocation, IconChevronRight, IconCheck } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
  ClientDialog,
  ClientDialogContent,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogDescription,
  ScrollArea,
} from "@afenda/shadcn";
import type { Workflow } from "./SOSWorkflowVisualizer";

interface SOSWorkflowPanelProps {
  workflows: Workflow[];
  currentWorkflowId?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SOS Workflow Panel - "Where Am I?" Content
 * Shows: Current location in workflow + Next recommended action
 */
export const SOSWorkflowPanel = React.memo<SOSWorkflowPanelProps>(({
  workflows,
  currentWorkflowId,
  isOpen,
  onClose,
}) => {
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

  return (
    <ClientDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ClientDialogContent className="sm:max-w-[28rem] max-h-[90vh] p-0">
        <ClientDialogHeader className="px-6 pt-6 pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconCurrentLocation className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <ClientDialogTitle className="text-base">Where Am I?</ClientDialogTitle>
              <ClientDialogDescription className="text-xs">
                Current workflow position and next steps
              </ClientDialogDescription>
            </div>
          </div>
        </ClientDialogHeader>
        
        <ScrollArea className="px-6 pb-6 max-h-[calc(90vh-8rem)]">
          <div className="space-y-4">
            {!contextualWorkflow ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-8">
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
                            onClick={onClose}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-xs">{w.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Current Workflow Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <contextualWorkflow.icon className="h-5 w-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm truncate">{contextualWorkflow.name}</CardTitle>
                        <CardDescription className="text-xs">{contextualWorkflow.description}</CardDescription>
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
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{contextualWorkflow.progress}%</span>
                      </div>
                      <Progress value={contextualWorkflow.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Current Step + Next Action */}
                {nextAction && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-2">
                        <IconChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm mb-1">
                            {nextAction.status === "current" ? "Current Step" : "Next Step"}
                          </CardTitle>
                          <p className="text-xs font-medium mb-1">{nextAction.title}</p>
                          <CardDescription className="text-xs mb-2">{nextAction.description}</CardDescription>
                          {nextAction.estimatedTime && (
                            <p className="text-[10px] text-muted-foreground">
                              ⏱️ Est. {nextAction.estimatedTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {nextAction.actionUrl && (
                      <CardContent className="pt-0">
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
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* All Steps */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-medium">All Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {contextualWorkflow.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-2 p-2 rounded text-xs transition-all ${
                          step.status === "current" ? "bg-primary/10 border border-primary/30" :
                          step.status === "completed" ? "opacity-60" :
                          "opacity-40"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          step.status === "completed" ? "bg-green-500" :
                          step.status === "current" ? "bg-primary" :
                          step.status === "blocked" ? "bg-destructive" :
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
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </ClientDialogContent>
    </ClientDialog>
  );
});

SOSWorkflowPanel.displayName = "SOSWorkflowPanel";
