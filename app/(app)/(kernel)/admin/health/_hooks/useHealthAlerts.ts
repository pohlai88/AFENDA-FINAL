"use client";

/**
 * Health Alerts Hook
 * Shows toast notifications when service health status changes.
 * 
 * @domain kernel
 * @layer hook
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface HealthData {
  services: Array<{
    serviceId: string;
    status: "healthy" | "degraded" | "down";
    latencyMs: number;
  }>;
}

export function useHealthAlerts(health: HealthData | undefined) {
  const prevStatus = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!health?.services) return;

    health.services.forEach((service) => {
      const prev = prevStatus.current[service.serviceId];
      
      // Only show alerts if status actually changed
      if (prev && prev !== service.status) {
        if (service.status === "down") {
          toast.error(`${service.serviceId} is down`, {
            description: "Service health check failed",
            duration: 5000,
          });
        } else if (service.status === "degraded") {
          toast.warning(`${service.serviceId} is degraded`, {
            description: `Response time: ${service.latencyMs}ms`,
            duration: 4000,
          });
        } else if (prev !== "healthy") {
          toast.success(`${service.serviceId} recovered`, {
            description: "Service is now healthy",
            duration: 3000,
          });
        }
      }
      
      prevStatus.current[service.serviceId] = service.status;
    });
  }, [health]);
}
