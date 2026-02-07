"use client";

/**
 * Event Correlation Component
 * Groups related audit events and shows event chains for better understanding.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@afenda/shadcn";

interface AuditEvent {
  id: string;
  action: string;
  resource: string;
  userId: string;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

interface EventGroup {
  correlationId: string;
  events: AuditEvent[];
  startTime: Date;
  endTime: Date;
  user: string;
  resource: string;
  summary: string;
}

interface EventCorrelationProps {
  events: AuditEvent[];
  correlationWindow?: number; // milliseconds
}

/**
 * Correlate events based on user, resource, and time proximity.
 */
function correlateEvents(events: AuditEvent[], windowMs: number = 60000): EventGroup[] {
  const groups: EventGroup[] = [];
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = typeof a.timestamp === "string" ? new Date(a.timestamp) : a.timestamp;
    const timeB = typeof b.timestamp === "string" ? new Date(b.timestamp) : b.timestamp;
    return timeA.getTime() - timeB.getTime();
  });

  for (const event of sortedEvents) {
    const eventTime = typeof event.timestamp === "string" ? new Date(event.timestamp) : event.timestamp;

    // Try to find an existing group to add this event to
    let addedToGroup = false;

    for (const group of groups) {
      const timeDiff = eventTime.getTime() - group.endTime.getTime();

      // Check if event belongs to this group
      if (
        timeDiff <= windowMs &&
        event.userId === group.user &&
        event.resource === group.resource
      ) {
        group.events.push(event);
        group.endTime = eventTime;
        addedToGroup = true;
        break;
      }
    }

    // Create new group if not added to existing one
    if (!addedToGroup) {
      groups.push({
        correlationId: event.correlationId || `group-${groups.length}`,
        events: [event],
        startTime: eventTime,
        endTime: eventTime,
        user: event.userId,
        resource: event.resource,
        summary: generateSummary([event]),
      });
    }
  }

  // Update summaries for multi-event groups
  for (const group of groups) {
    if (group.events.length > 1) {
      group.summary = generateSummary(group.events);
    }
  }

  return groups;
}

/**
 * Generate human-readable summary for event group.
 */
function generateSummary(events: AuditEvent[]): string {
  if (events.length === 1) {
    return `${events[0].action} ${events[0].resource}`;
  }

  const actions = new Set(events.map((e) => e.action));
  const resource = events[0].resource;

  if (actions.size === 1) {
    return `${events.length}x ${events[0].action} ${resource}`;
  }

  return `${events.length} operations on ${resource}`;
}

/**
 * Format time duration.
 */
function formatDuration(startTime: Date, endTime: Date): string {
  const diffMs = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 1) return "instant";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/**
 * Format timestamp.
 */
function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString();
}

export function EventCorrelation({ events, correlationWindow = 60000 }: EventCorrelationProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [showSingleEvents, setShowSingleEvents] = React.useState(false);

  const groups = React.useMemo(
    () => correlateEvents(events, correlationWindow),
    [events, correlationWindow]
  );

  const multiEventGroups = groups.filter((g) => g.events.length > 1);
  const singleEventGroups = groups.filter((g) => g.events.length === 1);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const displayGroups = showSingleEvents ? groups : multiEventGroups;

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No events to correlate
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Event Correlation</h3>
          <p className="text-sm text-muted-foreground">
            {multiEventGroups.length} event chains found
            {singleEventGroups.length > 0 && `, ${singleEventGroups.length} single events`}
          </p>
        </div>
        {singleEventGroups.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSingleEvents(!showSingleEvents)}
          >
            {showSingleEvents ? "Hide" : "Show"} Single Events
          </Button>
        )}
      </div>

      {/* Event Groups */}
      <div className="space-y-3">
        {displayGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.correlationId);
          const isMultiEvent = group.events.length > 1;

          return (
            <Card
              key={group.correlationId}
              className={isMultiEvent ? "border-blue-200 bg-blue-50/30" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      {group.summary}
                      {isMultiEvent && (
                        <Badge variant="secondary">{group.events.length} events</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                      <span>User: {group.user}</span>
                      <span>•</span>
                      <span>{formatTime(group.startTime)}</span>
                      {isMultiEvent && (
                        <>
                          <span>•</span>
                          <span>Duration: {formatDuration(group.startTime, group.endTime)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isMultiEvent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroup(group.correlationId)}
                    >
                      {isExpanded ? "Collapse" : "Expand"}
                    </Button>
                  )}
                </div>
              </CardHeader>

              {/* Event Chain */}
              {isExpanded && isMultiEvent && (
                <CardContent>
                  <div className="relative pl-6">
                    {/* Timeline line */}
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

                    {/* Events */}
                    <div className="space-y-4">
                      {group.events.map((event, _index) => (
                        <div key={event.id} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-4 top-2 size-2 rounded-full bg-blue-500 border-2 border-background" />

                          {/* Event details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{event.action}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatTime(event.timestamp)}
                              </span>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                  Metadata
                                </summary>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                  {JSON.stringify(event.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
