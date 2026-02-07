"use client";

/**
 * Health Indicator Client Component
 * Displays system health status with live polling and toast notifications.
 *
 * @domain app
 * @layer ui/shell
 */

import * as React from "react";
import { IconCircleFilled, IconAlertTriangle, IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  ClientTooltip as Tooltip,
  ClientTooltipContent as TooltipContent,
  ClientTooltipTrigger as TooltipTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@afenda/shadcn";

import type { ShellHealth } from "@afenda/orchestra";

import { routes } from "@afenda/shared/constants";

export interface HealthIndicatorClientProps {
  initialHealth: ShellHealth;
}

/**
 * Health status colors using semantic design system.
 */
const STATUS_COLORS = {
  healthy: "text-chart-1",
  degraded: "text-chart-3",
  down: "text-destructive",
} as const;

/**
 * Health status labels.
 */
const STATUS_LABELS = {
  healthy: "All systems operational",
  degraded: "Some services degraded",
  down: "System experiencing issues",
} as const;

/**
 * Polling interval for health checks (ms).
 */
const POLL_INTERVAL = 30000; // 30 seconds

/**
 * Client Component for health indicator in sidebar footer.
 * Polls /api/orchestra/health/v1 for live status updates.
 */
/**
 * Show toast notification for health status changes
 */
function showHealthToast(
  prevStatus: ShellHealth["status"],
  newStatus: ShellHealth["status"],
  newHealth: ShellHealth
) {
  if (prevStatus === newStatus) return;

  // Only notify on status changes after initial load
  if (prevStatus === "healthy" && newStatus === "degraded") {
    toast.warning("System Degraded", {
      description: `${newHealth.degradedCount} service${newHealth.degradedCount > 1 ? "s" : ""} experiencing issues`,
      icon: <IconAlertTriangle className="size-4" />,
      duration: 5000,
    });
  } else if (prevStatus === "healthy" && newStatus === "down") {
    toast.error("System Down", {
      description: `${newHealth.downCount} service${newHealth.downCount > 1 ? "s" : ""} unavailable`,
      icon: <IconCircleX className="size-4" />,
      duration: 8000,
    });
  } else if (prevStatus !== "healthy" && newStatus === "healthy") {
    toast.success("System Recovered", {
      description: "All services are now operational",
      icon: <IconCircleCheck className="size-4" />,
      duration: 4000,
    });
  } else if (prevStatus === "degraded" && newStatus === "down") {
    toast.error("System Down", {
      description: `${newHealth.downCount} service${newHealth.downCount > 1 ? "s" : ""} unavailable`,
      icon: <IconCircleX className="size-4" />,
      duration: 8000,
    });
  }
}

export function HealthIndicatorClient({
  initialHealth,
}: HealthIndicatorClientProps) {
  const [health, setHealth] = React.useState<ShellHealth>(initialHealth);
  const [isLoading, setIsLoading] = React.useState(false);
  const prevStatusRef = React.useRef<ShellHealth["status"]>(initialHealth.status);
  const isFirstLoad = React.useRef(true);

  // Poll health endpoint
  React.useEffect(() => {
    let mounted = true;
    let abortController: AbortController | null = null;

    const fetchHealth = async () => {
      if (!mounted) return;

      // Cancel previous request if still pending
      if (abortController) {
        abortController.abort();
      }

      abortController = new AbortController();
      setIsLoading(true);

      try {
        const response = await fetch(routes.api.orchestra.health(), {
          cache: "no-store",
          signal: abortController.signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (mounted && data.ok) {
            // Map from health response to ShellHealth shape
            const status = data.data.status as ShellHealth["status"];
            const newHealth: ShellHealth = {
              status,
              serviceCount: data.data.summary?.total ?? 0,
              healthyCount: data.data.summary?.healthy ?? 0,
              degradedCount: data.data.summary?.degraded ?? 0,
              downCount: data.data.summary?.down ?? 0,
            };

            // Show toast on status change (skip first load)
            if (!isFirstLoad.current) {
              showHealthToast(prevStatusRef.current, status, newHealth);
            }
            isFirstLoad.current = false;
            prevStatusRef.current = status;

            setHealth(newHealth);
          }
        }
      } catch (error) {
        // Ignore abort errors, silently fail for others
        if (error instanceof Error && error.name !== "AbortError") {
          // Keep last known state
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Initial fetch
    fetchHealth();

    // Set up polling
    const intervalId = setInterval(fetchHealth, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const colorClass = STATUS_COLORS[health.status];
  const statusLabel = STATUS_LABELS[health.status];
  const serviceInfo = `${health.healthyCount} of ${health.serviceCount} services healthy`;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton size="sm" className="cursor-default">
              <IconCircleFilled
                className={`size-3 ${colorClass} ${isLoading ? "animate-pulse" : ""}`}
              />
              <span className="text-xs text-muted-foreground">
                System Status
              </span>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            <div className="space-y-1">
              <p className="font-medium">{statusLabel}</p>
              <p className="text-xs text-muted-foreground">{serviceInfo}</p>
              {health.degradedCount > 0 && (
                <p className="text-xs text-chart-3">
                  {health.degradedCount} service{health.degradedCount > 1 ? "s" : ""} degraded
                </p>
              )}
              {health.downCount > 0 && (
                <p className="text-xs text-destructive">
                  {health.downCount} service{health.downCount > 1 ? "s" : ""} down
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
