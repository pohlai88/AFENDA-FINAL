"use client";

/**
 * Magic Tour Runner
 * In-actual (Retool-style): when a step has targetSelector, spotlights the real DOM element
 * and asks user to click / type / submit there. Otherwise dialog mode with optional branching.
 */

import * as React from "react";
import {
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconMapPin,
} from "@tabler/icons-react";

import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogHeader,
  ClientDialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Button,
  ScrollArea,
} from "@afenda/shadcn";

import type { Workflow, WorkflowStep } from "../../dashboard/_components/SOSWorkflowVisualizer";
import { SpotlightOverlay } from "./SpotlightOverlay.client";

export interface MagicTourRunnerProps {
  workflows: Workflow[];
  currentWorkflowId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  /** Behavior when user clicks the dimmed overlay. Default "close". */
  overlayClickBehavior?: "close" | "nextStep";
  onStepEnter?: (stepId: string, workflowId: string) => void;
  onStepLeave?: (stepId: string, workflowId: string) => void;
  onComplete?: (workflowId: string) => void;
  onSkip?: (workflowId: string, lastStepId: string | null) => void;
}

function getInitialWorkflow(
  workflows: Workflow[],
  currentWorkflowId?: string | null
): Workflow | null {
  if (workflows.length === 0) return null;
  if (currentWorkflowId) {
    const w = workflows.find((x) => x.id === currentWorkflowId);
    if (w) return w;
  }
  return workflows[0];
}

function getStepById(workflow: Workflow, stepId: string): WorkflowStep | undefined {
  return workflow.steps.find((s) => s.id === stepId);
}

/** Next options from current step: from nextSteps (branching) or linear. */
function getNextOptions(
  workflow: Workflow,
  currentStepId: string
): { toStepId: string; label: string }[] {
  const currentStep = getStepById(workflow, currentStepId);
  if (!currentStep) return [];

  if (workflow.nextSteps && workflow.nextSteps.length > 0) {
    const branches = workflow.nextSteps.filter((n) => n.fromStepId === currentStepId);
    if (branches.length > 0) {
      return branches.map((b) => ({
        toStepId: b.toStepId,
        label: b.label ?? getStepById(workflow, b.toStepId)?.title ?? b.toStepId,
      }));
    }
  }

  const idx = workflow.steps.findIndex((s) => s.id === currentStepId);
  if (idx >= 0 && idx < workflow.steps.length - 1) {
    const next = workflow.steps[idx + 1];
    return [{ toStepId: next.id, label: next.title }];
  }
  return [];
}

export const MagicTourRunner = React.memo<MagicTourRunnerProps>(
  function MagicTourRunner({
  workflows,
  currentWorkflowId,
  isOpen,
  onClose,
  overlayClickBehavior = "close",
  onStepEnter,
  onStepLeave,
  onComplete,
  onSkip,
}: MagicTourRunnerProps) {
    const initialWorkflow = React.useMemo(
      () => getInitialWorkflow(workflows, currentWorkflowId),
      [workflows, currentWorkflowId]
    );

    const [selectedWorkflowId, setSelectedWorkflowId] = React.useState<string | null>(
      () => initialWorkflow?.id ?? null
    );
    const [currentStepId, setCurrentStepId] = React.useState<string | null>(null);
    const [pathStack, setPathStack] = React.useState<string[]>([]);

    const workflow = workflows.find((w) => w.id === selectedWorkflowId) ?? initialWorkflow;
    const steps = workflow?.steps ?? [];
    const firstStepId = steps[0]?.id ?? null;
    const currentStep = currentStepId ? getStepById(workflow!, currentStepId) : null;
    const nextOptions = currentStepId && workflow ? getNextOptions(workflow, currentStepId) : [];
    const hasNext = nextOptions.length > 0;
    const isFirstStep = pathStack.length === 0;

    React.useEffect(() => {
      if (isOpen && initialWorkflow && firstStepId) {
        setSelectedWorkflowId(initialWorkflow.id);
        setCurrentStepId(firstStepId);
        setPathStack([]);
      }
    }, [isOpen, initialWorkflow?.id, firstStepId]);

    React.useEffect(() => {
      if (currentStepId && selectedWorkflowId && onStepEnter) {
        onStepEnter(currentStepId, selectedWorkflowId);
      }
    }, [currentStepId, selectedWorkflowId, onStepEnter]);

    const handleBack = React.useCallback(() => {
      if (pathStack.length === 0) return;
      const prev = pathStack[pathStack.length - 1];
      if (selectedWorkflowId && onStepLeave) onStepLeave(currentStepId!, selectedWorkflowId);
      setPathStack((s) => s.slice(0, -1));
      setCurrentStepId(prev);
    }, [pathStack, currentStepId, selectedWorkflowId, onStepLeave]);

    const handleNext = React.useCallback((toStepId?: string) => {
      if (!currentStepId) return;
      if (!toStepId) {
        if (nextOptions.length === 1) toStepId = nextOptions[0].toStepId;
        else return;
      }
      if (selectedWorkflowId && onStepLeave) onStepLeave(currentStepId, selectedWorkflowId);
      setPathStack((s) => [...s, currentStepId]);
      setCurrentStepId(toStepId);
    }, [currentStepId, nextOptions, selectedWorkflowId, onStepLeave]);

    const handleDone = React.useCallback(() => {
      if (currentStepId && selectedWorkflowId && onStepLeave) onStepLeave(currentStepId, selectedWorkflowId);
      if (selectedWorkflowId && onComplete) onComplete(selectedWorkflowId);
      onClose();
    }, [currentStepId, selectedWorkflowId, onStepLeave, onComplete, onClose]);

    const handleSkip = React.useCallback(() => {
      if (selectedWorkflowId && onSkip) onSkip(selectedWorkflowId, currentStepId);
      onClose();
    }, [selectedWorkflowId, currentStepId, onSkip, onClose]);

    const handleJumpToStep = React.useCallback((stepId: string) => {
      if (!workflow || currentStepId === stepId) return;
      const targetIdx = steps.findIndex((s) => s.id === stepId);
      if (targetIdx < 0) return;
      if (selectedWorkflowId && onStepLeave) onStepLeave(currentStepId!, selectedWorkflowId);
      setPathStack(steps.slice(0, targetIdx).map((s) => s.id));
      setCurrentStepId(stepId);
    }, [workflow, currentStepId, steps, selectedWorkflowId, onStepLeave]);

    const spotlightOnNext = React.useCallback(() => {
      if (nextOptions.length === 1) handleNext(nextOptions[0].toStepId);
      else handleDone();
    }, [nextOptions, handleNext, handleDone]);

    if (!isOpen || !workflow) return null;
    if (!currentStep && currentStepId) return null;

    const stepNumber = pathStack.length + 1;
    const hasTarget = currentStep?.targetSelector ?? currentStep?.targetResolver;
    const useSpotlight = Boolean(hasTarget) && nextOptions.length <= 1;
    const currentStepIdx = currentStepId
      ? steps.findIndex((s) => s.id === currentStepId) + 1
      : 0;
    const totalSteps = steps.length;

    /** In-actual step: spotlight the real element and ask user to click/type/submit there */
    if (useSpotlight && hasTarget && currentStep) {
      return (
        <SpotlightOverlay
          targetSelector={currentStep.targetSelector}
          getTarget={currentStep.targetResolver ?? undefined}
          title={currentStep.title}
          description={currentStep.description}
          actionHint={currentStep.actionHint}
          currentStepIndex={currentStepIdx}
          totalSteps={totalSteps}
          overlayClickBehavior={overlayClickBehavior}
          onNext={spotlightOnNext}
          onBack={handleBack}
          onSkip={handleSkip}
          canGoBack={!isFirstStep}
        />
      );
    }

    // Memoize content to prevent re-renders when props haven't changed
    const content = React.useMemo(() => (
      <div className="space-y-6">
        {/* Workflow icon + name + step indicator */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <workflow.icon className="size-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{workflow.name}</h3>
            <p className="text-xs text-muted-foreground">
              Step {stepNumber}
              {workflow.nextSteps?.length ? " (branching)" : ""}
            </p>
          </div>
        </div>

        {/* Current step */}
        {currentStep && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">{currentStep.title}</h4>
              <p className="text-sm text-muted-foreground">{currentStep.description}</p>
            </div>
            {currentStep.estimatedTime && (
              <p className="text-xs text-muted-foreground">Est. {currentStep.estimatedTime}</p>
            )}
            {currentStep.actionUrl && (
              <Button size="sm" className="w-full" asChild>
                <a href={currentStep.actionUrl}>
                  Go to this step
                  <IconChevronRight className="ml-2 size-4" />
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Jump to step: all steps list (keyboard navigable, aria-current for current step) */}
        {steps.length > 1 && (
          <div className="space-y-2">
            <p id="magic-tour-steps-label" className="text-xs font-medium text-muted-foreground">
              All steps
            </p>
            <div
              role="list"
              aria-labelledby="magic-tour-steps-label"
              className="flex flex-col gap-0.5"
            >
              {steps.map((s, i) => (
                <div key={s.id} role="listitem">
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(s.id)}
                    aria-current={s.id === currentStepId ? "step" : undefined}
                    className={`text-left text-sm w-full py-1 px-2 rounded transition-colors ${
                      s.id === currentStepId
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                      e.preventDefault();
                      const delta = e.key === "ArrowDown" ? 1 : -1;
                      const nextIdx = Math.max(0, Math.min(steps.length - 1, i + delta));
                      const next = steps[nextIdx];
                      if (next) (e.target as HTMLElement).closest("[role=list]")?.querySelector<HTMLButtonElement>(`[data-step-id="${next.id}"]`)?.focus();
                    }}
                    data-step-id={s.id}
                  >
                    {i + 1}. {s.title}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next: multiple branches or single Next / Done */}
        <div className="space-y-2">
          {nextOptions.length > 1 ? (
            <>
              <p className="text-xs font-medium text-muted-foreground">Choose next step</p>
              <div className="flex flex-col gap-2">
                {nextOptions.map((opt) => (
                  <Button
                    key={opt.toStepId}
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleNext(opt.toStepId)}
                  >
                    {opt.label}
                    <IconChevronRight className="ml-2 size-4" />
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={handleSkip} aria-label="Skip tour">
            <IconX className="mr-2 size-4" aria-hidden="true" />
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                aria-label="Previous step"
              >
                <IconChevronLeft className="mr-2 size-4" aria-hidden="true" />
                Back
              </Button>
            )}
            {hasNext && nextOptions.length === 1 && (
              <Button
                size="sm"
                onClick={() => handleNext(nextOptions[0].toStepId)}
                aria-label="Next step"
              >
                Next
                <IconChevronRight className="ml-2 size-4" aria-hidden="true" />
              </Button>
            )}
            {!hasNext && (
              <Button size="sm" onClick={handleDone} aria-label="Finish tour">
                <IconCheck className="mr-2 size-4" aria-hidden="true" />
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    ), [workflow, currentStep, steps, stepNumber, nextOptions, hasNext, isFirstStep, currentStepId, handleBack, handleNext, handleDone, handleSkip, handleJumpToStep]);

    const title = "Magic Tour";
    const description = workflow.name;

    return (
      <>
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="bottom">
          <DrawerContent className="sm:hidden max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <IconMapPin className="size-5 text-primary" />
                {title}
              </DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="px-4 pb-4 max-h-[calc(85vh-6rem)]">
              {content}
            </ScrollArea>
          </DrawerContent>
        </Drawer>

        <ClientDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <ClientDialogContent className="hidden sm:block sm:max-w-[28rem] max-h-[90vh] p-0">
            <ClientDialogHeader className="px-6 pt-6 pb-3">
              <ClientDialogTitle className="flex items-center gap-2">
                <IconMapPin className="size-5 text-primary" />
                {title}
              </ClientDialogTitle>
              <ClientDialogDescription>{description}</ClientDialogDescription>
            </ClientDialogHeader>
            <ScrollArea className="px-6 pb-6 max-h-[calc(90vh-8rem)]">
              {content}
            </ScrollArea>
          </ClientDialogContent>
        </ClientDialog>
      </>
    );
  }
);

MagicTourRunner.displayName = "MagicTourRunner";
