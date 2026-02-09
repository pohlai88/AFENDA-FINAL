/**
 * Service Detail Sheet
 * Read-only view of service details with health history
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  ClientSheet,
  ClientSheetContent,
  ClientSheetDescription,
  ClientSheetHeader,
  ClientSheetTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
} from "@afenda/shadcn";
import { toast } from "sonner";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import type { ServiceRecord } from "@afenda/orchestra/zod";
import { routes } from "@afenda/shared/constants";
import { UptimeStats } from "./UptimeStats.client";

const HealthHistoryChart = dynamic(
  () => import("./HealthHistoryChart.client").then((m) => ({ default: m.HealthHistoryChart })),
  { ssr: false, loading: () => <Skeleton className="h-[180px] w-full" /> }
);

interface HealthHistoryEntry {
  id: string;
  serviceId: string;
  status: string;
  latencyMs: number | null;
  errorMessage: string | null;
  recordedAt: string;
}

interface UptimeData {
  uptime: number;
  total: number;
  healthy: number;
}

interface ServiceDetailSheetProps {
  serviceId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ServiceDetailSheet({
  serviceId,
  open,
  onClose,
}: ServiceDetailSheetProps) {
  const [service, setService] = useState<ServiceRecord | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthHistoryEntry[]>([]);
  const [uptimeData, setUptimeData] = useState<UptimeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const [historyHours] = useState(24);

  const fetchServiceDetails = useCallback(async () => {
    if (!serviceId) return;

    setIsLoading(true);
    try {
      const response = await fetch(routes.api.orchestra.serviceById(serviceId));
      const result = await response.json();

      if (result.ok) {
        setService(result.data);
      } else {
        toast.error(result.error?.message || "Failed to load service details");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  const fetchHealthHistory = useCallback(async () => {
    if (!serviceId) return;

    try {
      const response = await fetch(
        routes.api.orchestra.serviceHistory(serviceId, historyHours)
      );
      const result = await response.json();

      if (result.ok) {
        setHealthHistory(result.data.history.entries || []);
        setUptimeData(result.data.uptime || null);
      }
    } catch {
      // Error surfaced via empty state
    }
  }, [serviceId, historyHours]);

  useEffect(() => {
    if (open && serviceId) {
      fetchServiceDetails();
      fetchHealthHistory();
    }
  }, [open, serviceId, fetchServiceDetails, fetchHealthHistory]);

  const handleTestHealth = async () => {
    if (!serviceId) return;

    setIsTestingHealth(true);
    try {
      const response = await fetch(
        routes.api.orchestra.serviceHealth(serviceId),
        { method: "POST" }
      );
      const result = await response.json();

      if (result.ok) {
        toast.success(`Health Check Complete: ${result.data.status} | Latency: ${result.data.latencyMs}ms`);
        fetchServiceDetails();
        fetchHealthHistory();
      } else {
        toast.error(result.error?.message || "Failed to perform health check");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsTestingHealth(false);
    }
  };

  return (
    <ClientSheet open={open} onOpenChange={onClose}>
      <ClientSheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <ClientSheetHeader>
          <ClientSheetTitle>{serviceId}</ClientSheetTitle>
          <ClientSheetDescription>Service details and health information</ClientSheetDescription>
        </ClientSheetHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : service ? (
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Service Information</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestHealth}
                    disabled={isTestingHealth}
                  >
                    <IconRefresh className="mr-2 size-4" />
                    {isTestingHealth ? "Testing..." : "Test Health"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">ID</div>
                    <div className="font-mono text-sm">{service.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge
                      variant={
                        service.status === "healthy"
                          ? "default"
                          : service.status === "degraded"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {service.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Endpoint</div>
                  <div className="font-mono text-sm break-all">{service.endpoint}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Health Check Path</div>
                  <div className="font-mono text-sm">{service.healthCheck}</div>
                </div>

                {service.description && (
                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="text-sm">{service.description}</div>
                  </div>
                )}

                {service.version && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Version</div>
                      <div className="text-sm">{service.version}</div>
                    </div>
                  </div>
                )}

                {service.tags && service.tags.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {service.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {(service.ownerContact || service.documentationUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Documentation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.ownerContact && (
                    <div>
                      <div className="text-sm text-muted-foreground">Owner Contact</div>
                      <div className="text-sm">{service.ownerContact}</div>
                    </div>
                  )}
                  {service.documentationUrl && (
                    <div>
                      <div className="text-sm text-muted-foreground">Documentation</div>
                      <a
                        href={service.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {service.documentationUrl}
                        <IconExternalLink className="size-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Health Check Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Check Interval</div>
                    <div className="text-sm">
                      {service.healthCheckIntervalMs
                        ? `${service.healthCheckIntervalMs}ms`
                        : "30000ms (default)"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Timeout</div>
                    <div className="text-sm">
                      {service.healthCheckTimeoutMs
                        ? `${service.healthCheckTimeoutMs}ms`
                        : "5000ms (default)"}
                    </div>
                  </div>
                </div>
                {service.lastHealthCheck && (
                  <div>
                    <div className="text-sm text-muted-foreground">Last Health Check</div>
                    <div className="text-sm">
                      {new Date(service.lastHealthCheck).toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {uptimeData && (
              <UptimeStats
                uptime={uptimeData.uptime}
                total={uptimeData.total}
                healthy={uptimeData.healthy}
                hours={historyHours}
              />
            )}

            {healthHistory.length > 0 && (
              <HealthHistoryChart entries={healthHistory} hours={historyHours} />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Timestamps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Registered At</div>
                    <div className="text-sm">
                      {new Date(service.registeredAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Updated At</div>
                    <div className="text-sm">
                      {new Date(service.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No service details available
          </div>
        )}
      </ClientSheetContent>
    </ClientSheet>
  );
}
