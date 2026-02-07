"use client";

/**
 * Onboarding Wizard Provider
 * Context provider for onboarding state management.
 */

import * as React from "react";
import { ONBOARDING_STORAGE_KEY } from "./onboarding-content";

interface OnboardingContextValue {
  isOpen: boolean;
  currentStep: number;
  hasCompleted: boolean;
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  setStep: (step: number) => void;
}

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null);

export function OnboardingWizardProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [hasCompleted, setHasCompleted] = React.useState(true);

  // Check localStorage on mount
  React.useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const isCompleted = completed === "true";
    setHasCompleted(isCompleted);

    // Auto-open wizard for first-time users
    if (!isCompleted) {
      setIsOpen(true);
    }
  }, []);

  const startOnboarding = React.useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const nextStep = React.useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const prevStep = React.useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipOnboarding = React.useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setHasCompleted(true);
  }, []);

  const completeOnboarding = React.useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setHasCompleted(true);
  }, []);

  const setStep = React.useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const value: OnboardingContextValue = {
    isOpen,
    currentStep,
    hasCompleted,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    setStep,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingWizardProvider");
  }
  return context;
}
