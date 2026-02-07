"use client";

/**
 * Real-Time Audit Stream
 * Live audit event feed using WebSocket for real-time updates.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Alert, AlertDescription } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

interface AuditEvent {
  id: string;
  action: string;
  resource: string;
  userId: string;
  timestamp: Date | string;
  status: "success" | "error" | "warning";
  metadata?: Record<string, unknown>;
}

interface RealTimeAuditStreamProps {
  maxEvents?: number;
  autoScroll?: boolean;
}

/**
 * Format timestamp for display.
 */
function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString();
}

/**
 * Get status badge variant.
 */
function getStatusBadge(status: string) {
  switch (status) {
    case "success":
      return <Badge className="bg-green-500">Success</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    case "warning":
      return <Badge className="bg-yellow-500">Warning</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function RealTimeAuditStream({ maxEvents = 50, autoScroll = true }: RealTimeAuditStreamProps) {
  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const eventsEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (autoScroll && !isPaused && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, autoScroll, isPaused]);

  // Server-Sent Events connection
  React.useEffect(() => {
    if (isPaused) return;

    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        // Connect to SSE endpoint
        eventSource = new EventSource(routes.api.orchestra.auditStream());

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "audit_event" && data.data) {
              const auditEvent: AuditEvent = {
                id: data.data.id,
                action: data.data.eventType,
                resource: data.data.entityType,
                userId: data.data.actorId || "system",
                timestamp: data.data.timestamp,
                status: data.data.details?.status || "success",
                metadata: data.data.details,
              };

              setEvents((prev) => {
                const updated = [auditEvent, ...prev];
                return updated.slice(0, maxEvents);
              });
            }
          } catch (err) {
            // Error parsing SSE message - skip invalid events
            void err;
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          setError("Connection lost. Reconnecting...");
          eventSource?.close();

          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (!isPaused) {
              connectSSE();
            }
          }, 5000);
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to connect to audit stream";
        setError(errorMessage);
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      eventSource?.close();
      setIsConnected(false);
    };
  }, [maxEvents, isPaused]);

  const handleClear = () => {
    setEvents([]);
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Real-Time Audit Stream</CardTitle>
            <Badge variant={isConnected ? "default" : "secondary"}>
              <span className={`inline-block size-2 rounded-full mr-2 ${isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {events.length > 0 && (
              <Badge variant="outline">{events.length} events</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePause}
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={events.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isPaused && (
          <Alert className="mb-4">
            <AlertDescription>
              Stream paused. Click Resume to continue receiving events.
            </AlertDescription>
          </Alert>
        )}

        {events.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {isConnected ? "Waiting for audit events..." : "Connecting to audit stream..."}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">
                      {event.action}
                    </Badge>
                    <span className="text-sm font-medium truncate">
                      {event.resource}
                    </span>
                    {getStatusBadge(event.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{event.userId}</span>
                    <span>•</span>
                    <span>{formatTime(event.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={eventsEndRef} />
          </div>
        )}

        {!isConnected && !error && (
          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              Real-time audit stream requires WebSocket connection.
              In production, this will connect to your audit stream endpoint.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
