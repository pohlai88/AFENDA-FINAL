/**
 * App Layout - Authenticated app routes
 * Uses shadcn sidebar-07 pattern with proper SidebarProvider structure.
 * Requires authentication for all child routes.
 * Defense-in-depth: proxy (auth redirect) + layout auth guard (CVE-2025-29927).
 */

import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { SkipLink } from "@afenda/shadcn";
import { Skeleton } from "@afenda/shadcn";
import { SidebarProvider, SidebarInset } from "@afenda/shadcn";
import { AppSiteHeader } from "@afenda/shadcn/blocks/app-site-header";
import { CommandPaletteProvider, OnboardingWizardProvider, OnboardingWizard, ContextualHelper } from "./(kernel)/_shell";
import {
  UserProvider,
  ErrorBoundaryWithRecovery,
} from "@/app/_components";
import { auth } from "@afenda/auth/server";
import { routes } from "@afenda/shared/constants";
import { HeaderContent } from "./_components/header-content";
import { AppSidebarWrapper } from "./_components/app-sidebar-wrapper";

async function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect(routes.ui.auth.login());
  return <>{children}</>;
}

function AppShellSkeleton() {
  return (
    <div className="flex h-screen" aria-busy="true" aria-label="Loading application">
      <div className="w-64 border-r p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

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
      <React.Suspense fallback={<AppShellSkeleton />}>
        <AuthGuard>
          <UserProvider>
            <OnboardingWizardProvider>
              <CommandPaletteProvider>
                <SidebarProvider>
                  <AppSidebarWrapper />
                  <SidebarInset>
                    <AppSiteHeader>
                      <HeaderContent />
                    </AppSiteHeader>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 lg:gap-6 lg:p-6 lg:pt-0">
                      {children}
                    </div>
                  </SidebarInset>
                </SidebarProvider>
                <OnboardingWizard />
                <ContextualHelper />
                <Toaster position="top-right" richColors />
              </CommandPaletteProvider>
            </OnboardingWizardProvider>
          </UserProvider>
        </AuthGuard>
      </React.Suspense>
    </ErrorBoundaryWithRecovery>
  );
}
