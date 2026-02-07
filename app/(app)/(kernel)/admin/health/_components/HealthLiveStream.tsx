"use client";

/**
 * Health Live Stream
 * Optional SSE panel for real-time health updates (Next.js: client-only, cleanup on unmount).
 */

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { IconRadio, IconChevronDown, IconChevronUp } from "@tabler/icons-react";

interface HealthUpdate {
  type: string;
  data?: {
    serviceId?: string;
    status?: string;
    latencyMs?: number;
    timestamp?: string;
  };
}

const MAX_EVENTS = 20;

function formatTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

export function HealthLiveStream() {
  const [events, setEvents] = React.useState<HealthUpdate[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    let eventSource: EventSource | null = null;

    const connect = () => {
      try {
        setError(null);
        eventSource = new EventSource(routes.api.orchestra.healthStream());
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => setIsConnected(true);
        eventSource.onerror = () => {
          setIsConnected(false);
          setError("Connection lost");
        };

        eventSource.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data) as HealthUpdate;
            setEvents((prev) => [payload, ...prev].slice(0, MAX_EVENTS));
          } catch {
            // ignore malformed
          }
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect");
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isOpen]);

  // Defer Collapsible to client-only to avoid Radix ID mismatch between server and client (hydration error).
  // Server and initial client render the same static placeholder; after mount we render the real Collapsible.
  if (!mounted) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Live updates</CardTitle>
            <Button variant="ghost" size="sm" type="button" disabled aria-expanded={false}>
              <IconChevronDown className="size-4" />
              <span className="sr-only">Expand</span>
            </Button>
          </div>
          <CardDescription>
            Optional Server-Sent Events stream for real-time health updates
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 hidden">
          <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-md border bg-muted/30 p-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Live updates</CardTitle>
              {isOpen && (
                <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                  {isConnected ? "Connected" : "Reconnecting…"}
                </Badge>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
                <span className="sr-only">{isOpen ? "Collapse" : "Expand"}</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CardDescription>
            Optional Server-Sent Events stream for real-time health updates
          </CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {error && (
              <p className="text-sm text-destructive mb-2">{error}</p>
            )}
            <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-md border bg-muted/30 p-2">
              {events.length === 0 && isConnected && (
                <p className="text-xs text-muted-foreground">Waiting for events…</p>
              )}
              {events.length === 0 && !isConnected && isOpen && (
                <p className="text-xs text-muted-foreground">Connecting…</p>
              )}
              {events.map((evt, i) => (
                <div
                  key={i}
                  className="text-xs font-mono flex flex-wrap items-center gap-2 py-1 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground">{formatTime(evt.data?.timestamp)}</span>
                  {evt.data?.serviceId && (
                    <span className="truncate max-w-[120px]">{evt.data.serviceId}</span>
                  )}
                  {evt.data?.status && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {evt.data.status}
                    </Badge>
                  )}
                  {evt.data?.latencyMs != null && (
                    <span className="text-muted-foreground">{evt.data.latencyMs}ms</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
