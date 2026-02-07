/**
 * App Layout - Authenticated app routes
 * Wraps content with AppShell for navigation.
 * Requires authentication for all child routes.
 */

import * as React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SkipLink } from "@afenda/shadcn";
import { CommandPaletteProvider, OnboardingWizardProvider, OnboardingWizard, ContextualHelper } from "./(kernel)/_shell";
import { AppShell } from "./(kernel)/_shell";
import {
  UserProvider,
  ErrorBoundaryWithRecovery,
} from "@/app/_components";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | AFENDA",
  },
  description: "AFENDA enterprise workflow orchestration platform - Authenticated dashboard",
  robots: {
    index: false, // Authenticated pages should not be indexed
    follow: false,
  },
  openGraph: {
    type: "website",
    url: "https://afenda.com",
    title: "AFENDA",
    description: "AFENDA enterprise workflow orchestration platform",
    images: [
      {
        url: "https://afenda.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AFENDA",
      },
    ],
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundaryWithRecovery>
      <SkipLink href="#main-content" />
      <UserProvider>
        <OnboardingWizardProvider>
          <CommandPaletteProvider>
            <AppShell>{children}</AppShell>
            <OnboardingWizard />
            <ContextualHelper />
            <Toaster position="top-right" richColors />
          </CommandPaletteProvider>
        </OnboardingWizardProvider>
      </UserProvider>
    </ErrorBoundaryWithRecovery>
  );
}
