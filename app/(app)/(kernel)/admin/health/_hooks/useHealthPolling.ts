"use client";

/**
 * Health Polling Hook
 * Polls health endpoint every 30 seconds using SWR.
 * 
 * @domain kernel
 * @layer hook
 */

import useSWR from "swr";
import { routes } from "@afenda/shared/constants";

interface HealthData {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  services: Array<{
    serviceId: string;
    status: "healthy" | "degraded" | "down";
    latencyMs: number;
    lastCheck: string;
    error: string | null;
  }>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();
  if (data.ok) {
    return data.data;
  }
  throw new Error(data.error?.message || "Failed to fetch health data");
};

export function useHealthPolling(intervalMs = 30000) {
  const { data, error, mutate, isLoading } = useSWR<HealthData>(
    routes.api.orchestra.health(),
    fetcher,
    {
      refreshInterval: intervalMs,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    health: data,
    error,
    isLoading,
    refresh: mutate,
  };
}
