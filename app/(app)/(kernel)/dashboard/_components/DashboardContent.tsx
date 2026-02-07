"use client";

/**
 * Dashboard Content Wrapper
 * Client component that wraps dashboard content with error boundary and auto-refresh.
 */

import * as React from "react";
import { DashboardErrorBoundary } from "./DashboardErrorBoundary";
import { AutoRefreshWrapper } from "./AutoRefreshWrapper";
import { useAriaAnnounce, AriaLiveRegionHook } from "./AriaLiveRegion";

interface DashboardContentProps {
  children: React.ReactNode;
}

export function DashboardContent({ children }: DashboardContentProps) {
  const { announce, announcement } = useAriaAnnounce();

  // Announce dashboard refreshes for screen readers
  React.useEffect(() => {
    const handleRefresh = () => {
      announce("Dashboard data refreshed");
    };

    // Listen for custom refresh events (if implemented)
    window.addEventListener("dashboard:refresh", handleRefresh);
    
    return () => {
      window.removeEventListener("dashboard:refresh", handleRefresh);
    };
  }, [announce]);

  return (
    <DashboardErrorBoundary>
      <AriaLiveRegionHook announcement={announcement} politeness="polite" />
      <AutoRefreshWrapper intervalMs={30000} enabled={true}>
        {children}
      </AutoRefreshWrapper>
    </DashboardErrorBoundary>
  );
}
