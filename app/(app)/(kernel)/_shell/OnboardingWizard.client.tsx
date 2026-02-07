"use client";

/**
 * Onboarding Wizard Component
 * Multi-step wizard for first-time users.
 */

import * as React from "react";
import Link from "next/link";
import { IconX, IconChevronLeft, IconChevronRight, IconCheck } from "@tabler/icons-react";

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
  Badge,
  Checkbox,
} from "@afenda/shadcn";

import { useOnboarding } from "./OnboardingWizardProvider.client";
import { ONBOARDING_STEPS } from "./onboarding-content";

export const OnboardingWizard = React.memo(function OnboardingWizard() {
  const {
    isOpen,
    currentStep,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      if (dontShowAgain) {
        completeOnboarding();
      } else {
        skipOnboarding();
      }
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      completeOnboarding();
    } else {
      skipOnboarding();
    }
  };

  if (!step) return null;

  const content = (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        {ONBOARDING_STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${index === currentStep
                ? "w-8 bg-primary"
                : index < currentStep
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted"
              }`}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={ONBOARDING_STEPS.length}
            aria-label={`Step ${index + 1} of ${ONBOARDING_STEPS.length}`}
          />
        ))}
      </div>

      {/* Icon */}
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-primary/10">
          {step.icon && <step.icon className="size-8 text-primary" aria-hidden="true" />}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <ul className="space-y-2" role="list">
          {step.content.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Badge variant="outline" className="mt-0.5 shrink-0" aria-hidden="true">
                {index + 1}
              </Badge>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        {step.actions && step.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {step.actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                asChild={!!action.href}
                onClick={action.onClick}
              >
                {action.href ? (
                  <Link href={action.href}>{action.label}</Link>
                ) : (
                  action.label
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Don't show again checkbox (last step) */}
      {isLastStep && (
        <div className="flex items-center gap-2 pt-4 border-t">
          <Checkbox
            id="dont-show"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            aria-label="Don't show onboarding again"
          />
          <label
            htmlFor="dont-show"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            Don&apos;t show this again
          </label>
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex items-center justify-between gap-3 pt-6 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          aria-label="Skip onboarding"
        >
          <IconX className="mr-2 size-4" aria-hidden="true" />
          Skip
        </Button>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              aria-label="Go to previous step"
            >
              <IconChevronLeft className="mr-2 size-4" aria-hidden="true" />
              Back
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleNext}
            aria-label={isLastStep ? "Complete onboarding" : "Go to next step"}
          >
            {isLastStep ? (
              <>
                <IconCheck className="mr-2 size-4" aria-hidden="true" />
                Get Started
              </>
            ) : (
              <>
                Next
                <IconChevronRight className="ml-2 size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Use shadcn responsive utilities - both components render, CSS controls visibility
  return (
    <>
      {/* Mobile: Drawer */}
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
        <DrawerContent className="sm:hidden">
          <DrawerHeader>
            <DrawerTitle>{step.title}</DrawerTitle>
            <DrawerDescription>{step.description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Desktop: Dialog (Client* for hydration) */}
      <ClientDialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
        <ClientDialogContent className="hidden sm:block sm:max-w-[500px]">
          <ClientDialogHeader>
            <ClientDialogTitle>{step.title}</ClientDialogTitle>
            <ClientDialogDescription>{step.description}</ClientDialogDescription>
          </ClientDialogHeader>
          {content}
        </ClientDialogContent>
      </ClientDialog>
    </>
  );
});
