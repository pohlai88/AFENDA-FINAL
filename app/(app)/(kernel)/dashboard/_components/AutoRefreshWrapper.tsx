"use client";

/**
 * Auto-Refresh Dashboard Wrapper
 * Wraps dashboard content with automatic refresh capability.
 *
 * @domain app
 * @layer component
 */

import * as React from "react";
import { useAutoRefresh } from "./useAutoRefresh";
import { Badge } from "@afenda/shadcn";
import { IconRefresh } from "@tabler/icons-react";

interface AutoRefreshWrapperProps {
  children: React.ReactNode;
  intervalMs?: number;
  enabled?: boolean;
}

export function AutoRefreshWrapper({
  children,
  intervalMs = 30000,
  enabled = true,
}: AutoRefreshWrapperProps) {
  const { lastRefresh, isRefreshing, refresh } = useAutoRefresh({
    intervalMs,
    enabled,
  });
  
  // Prevent hydration mismatch by only showing timestamp after mount
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative">
      {/* Refresh indicator */}
      <div className="refresh-indicator">
        <Badge
          variant="outline"
          className="text-xs"
          role="status"
          aria-live="polite"
          aria-label={
            isRefreshing 
              ? "Refreshing dashboard data" 
              : isMounted 
                ? `Last refreshed ${lastRefresh.toLocaleTimeString()}` 
                : "Dashboard live updates enabled"
          }
        >
          <IconRefresh
            className={`mr-1 h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {isRefreshing ? "Refreshing..." : "Live"}
        </Badge>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="refresh-button"
          aria-label="Manually refresh dashboard data"
        >
          Refresh now
        </button>
      </div>
      {children}
    </div>
  );
}
