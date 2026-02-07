"use client";

/**
 * Health Stream Widget
 * Live health status from SSE stream; complements server-rendered dashboard health.
 *
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { getHealthColor } from "./colorUtils";

interface HealthUpdateData {
  serviceId: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  timestamp: string;
  checks?: { database?: string; api?: string; cache?: string };
}

interface StreamMessage {
  type: "connected" | "health_update";
  timestamp?: string;
  data?: HealthUpdateData;
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const s = Math.floor((now - d.getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function HealthStreamWidget() {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<HealthUpdateData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      try {
        eventSource = new EventSource(routes.api.orchestra.healthStream());

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event: MessageEvent) => {
          try {
            const msg = JSON.parse(event.data) as StreamMessage;
            if (msg.type === "health_update" && msg.data) {
              setLastUpdate(msg.data);
            }
          } catch {
            // Skip malformed messages
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          setError("Stream disconnected");
          eventSource?.close();
          eventSource = null;
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to connect";
        setError(message);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
      setIsConnected(false);
    };
  }, []);

  const checks = lastUpdate?.checks;
  const status = lastUpdate?.status ?? "healthy";
  const statusColor = getHealthColor(status as "healthy" | "degraded" | "down");

  return (
    <Card className="relative">
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>Health stream</CardDescription>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${isConnected ? "text-chart-1" : "text-muted-foreground"}`}
            aria-live="polite"
          >
            <span
              className={`inline-block size-2 rounded-full ${isConnected ? "bg-chart-1 animate-pulse" : "bg-muted-foreground"}`}
            />
            {isConnected ? "Live" : "Reconnecting…"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        {lastUpdate ? (
          <>
            <CardTitle className="text-lg capitalize tabular-nums">
              <span className={statusColor}>{status}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Updated {formatRelativeTime(lastUpdate.timestamp)}
              {lastUpdate.latencyMs > 0 && ` · ${lastUpdate.latencyMs}ms`}
            </p>
            {checks && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground pt-1">
                {["database", "api", "cache"].map((key) => {
                  const v = checks[key as keyof typeof checks];
                  if (v === undefined) return null;
                  const isOk = v === "healthy";
                  return (
                    <span key={key}>
                      <span className="capitalize">{key}</span>{" "}
                      <span className={isOk ? "text-chart-1" : "text-destructive"}>{isOk ? "✓" : v}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isConnected ? "Waiting for health updates…" : "Connecting…"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
