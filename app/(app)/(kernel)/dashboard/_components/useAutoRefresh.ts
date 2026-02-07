"use client";

/**
 * Auto-Refresh Metrics Hook
 * Provides automatic polling for dashboard metrics updates.
 *
 * @domain app
 * @layer hook
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AutoRefreshOptions {
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * Hook to automatically refresh data at specified intervals
 */
export function useAutoRefresh(options: AutoRefreshOptions = {}) {
  const { intervalMs = 30000, enabled = true } = options; // Default: 30 seconds
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    if (!isRefreshing) {
      setIsRefreshing(true);
      router.refresh();
      setLastRefresh(new Date());
      // Reset refreshing state after a short delay
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [router, isRefreshing]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMs, refresh]);

  return {
    lastRefresh,
    isRefreshing,
    refresh,
  };
}
