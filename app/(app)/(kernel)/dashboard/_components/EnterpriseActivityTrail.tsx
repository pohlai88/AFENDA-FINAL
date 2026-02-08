"use client";

/**
 * Enterprise Activity Trail
 * Professional audit event display with filtering, categorization, comments, and details
 */

import * as React from "react";
import {
  IconShield,
  IconUser,
  IconSettings,
  IconDatabase,
  IconActivity,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconSearch,
  IconFilter,
  IconChevronRight,
  IconExternalLink,
  IconMessageCircle,
  IconSend,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import {
  Badge,
  Button,
  Input,
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
  ScrollArea,
  Textarea,
} from "@afenda/shadcn";
import { formatDistanceToNow } from "date-fns";
import { routes } from "@afenda/shared/constants";
import { addAuditComment, getAuditComments, type AuditComment } from "../_actions/audit-comments.actions";
import { useUser } from "@/app/_components/user-context";
import { useEnterpriseSearch } from "../../../_hooks/useEnterpriseSearch";

interface AuditLogEntry {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string | null;
  actorId: string | null;
  actorType: string | null;
  details: Record<string, unknown> | null;
  previousValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  traceId: string | null;
  createdAt: string;
}

interface EnterpriseActivityTrailProps {
  entries: AuditLogEntry[];
  maxHeight?: string;
}

// Event categorization and styling
const getEventCategory = (eventType: string, entityType: string) => {
  const lowerEvent = eventType.toLowerCase();
  const lowerEntity = entityType.toLowerCase();

  if (lowerEvent.includes("create") || lowerEvent.includes("insert")) {
    return {
      category: "create",
      icon: IconCheck,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950/30",
      badgeVariant: "default" as const,
    };
  }

  if (lowerEvent.includes("update") || lowerEvent.includes("modify") || lowerEvent.includes("change")) {
    return {
      category: "update",
      icon: IconSettings,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950/30",
      badgeVariant: "secondary" as const,
    };
  }

  if (lowerEvent.includes("delete") || lowerEvent.includes("remove")) {
    return {
      category: "delete",
      icon: IconAlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-950/30",
      badgeVariant: "destructive" as const,
    };
  }

  if (lowerEvent.includes("auth") || lowerEvent.includes("login") || lowerEvent.includes("logout")) {
    return {
      category: "auth",
      icon: IconShield,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950/30",
      badgeVariant: "secondary" as const,
    };
  }

  if (lowerEntity.includes("user") || lowerEvent.includes("user")) {
    return {
      category: "user",
      icon: IconUser,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-950/30",
      badgeVariant: "secondary" as const,
    };
  }

  // Default category
  return {
    category: "system",
    icon: IconActivity,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-950/30",
    badgeVariant: "outline" as const,
  };
};

// Format event type for display
const formatEventType = (eventType: string) => {
  return eventType
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" → ");
};

// Get actor display name
const getActorDisplay = (actorType: string | null, actorId: string | null) => {
  if (!actorType && !actorId) return "System";
  if (actorType === "system") return "System";
  if (actorType === "user") return actorId ? `User ${actorId.slice(0, 8)}` : "User";
  return actorType || "Unknown";
};

// Comment Section Component
interface CommentSectionProps {
  auditLogId: string;
  onCommentAdded?: () => void;
}

function CommentSection({ auditLogId, onCommentAdded }: CommentSectionProps) {
  const { user } = useUser();
  const [comments, setComments] = React.useState<AuditComment[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  // Load comments when expanded
  React.useEffect(() => {
    if (isExpanded && !hasLoaded) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, hasLoaded, auditLogId]);

  const loadComments = async () => {
    try {
      const data = await getAuditComments(auditLogId);
      setComments(data);
      setHasLoaded(true);
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.id) return;

    setIsLoading(true);
    try {
      const comment = await addAuditComment({
        auditLogId,
        userId: user.id,
        userName: user.name || user.email || "Unknown User",
        comment: newComment.trim(),
      });

      setComments((prev) => [comment, ...prev]);
      setNewComment("");
      onCommentAdded?.();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleAddComment();
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between h-auto py-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <IconMessageCircle className="h-4 w-4" />
          <span className="text-sm">Comments</span>
          {comments.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {comments.length}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <IconChevronUp className="h-4 w-4" />
        ) : (
          <IconChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Comments Section */}
      {isExpanded && (
        <div className="space-y-3 pl-2">
          {/* Add Comment */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment... (Cmd+Enter to submit)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] text-sm resize-none"
              disabled={isLoading}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim() || isLoading}
                className="gap-2"
              >
                <IconSend className="h-3 w-3" />
                {isLoading ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          {comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 rounded-md bg-muted/50 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary">
                        <IconUser className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium">
                        {comment.userName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm pl-8">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}

          {comments.length === 0 && hasLoaded && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No comments yet. Be the first to add context!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function EnterpriseActivityTrail({ entries, maxHeight = "400px" }: EnterpriseActivityTrailProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // Enterprise-grade search with advanced features
  const enterpriseSearch = useEnterpriseSearch(entries, {
    fields: [
      { field: 'eventType', weight: 0.9 },
      { field: 'entityType', weight: 0.7 },
      { field: 'actorType', weight: 0.5 },
      { field: 'actorId', weight: 0.4 },
      {
        field: 'details',
        weight: 0.3,
        transform: (value: unknown) => JSON.stringify(value),
      },
    ],
    debounceMs: 300,
    cacheTTL: 5000,
    limit: 100,
    sortBy: 'relevance',
    filters: selectedCategory ? { category: selectedCategory } : {},
  });

  // Apply category filtering to search results
  const filteredEntries = React.useMemo(() => {
    if (!selectedCategory) return enterpriseSearch.items;

    return enterpriseSearch.items.filter((entry) => {
      const category = getEventCategory(entry.eventType, entry.entityType);
      return category.category === selectedCategory;
    });
  }, [enterpriseSearch.items, selectedCategory]);

  // Get category counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((entry) => {
      const category = getEventCategory(entry.eventType, entry.entityType);
      counts[category.category] = (counts[category.category] || 0) + 1;
    });
    return counts;
  }, [entries]);

  const categories = [
    { id: "create", label: "Create", icon: IconCheck },
    { id: "update", label: "Update", icon: IconSettings },
    { id: "delete", label: "Delete", icon: IconAlertTriangle },
    { id: "auth", label: "Auth", icon: IconShield },
    { id: "user", label: "User", icon: IconUser },
    { id: "system", label: "System", icon: IconActivity },
  ];

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={enterpriseSearch.query}
            onChange={(e) => enterpriseSearch.search(e.target.value)}
            className="pl-9"
          />
        </div>

        <ClientPopover>
          <ClientPopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <IconFilter className="h-4 w-4" />
              Filter
              {selectedCategory && (
                <Badge variant="secondary" className="ml-1">
                  1
                </Badge>
              )}
            </Button>
          </ClientPopoverTrigger>
          <ClientPopoverContent className="w-64" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Event Categories</h4>
              <div className="space-y-1">
                <Button
                  variant={selectedCategory === null ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Events
                  <Badge variant="outline" className="ml-auto">
                    {entries.length}
                  </Badge>
                </Button>
                {categories.map((cat) => {
                  const count = categoryCounts[cat.id] || 0;
                  if (count === 0) return null;

                  return (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    >
                      <cat.icon className="mr-2 h-4 w-4" />
                      {cat.label}
                      <Badge variant="outline" className="ml-auto">
                        {count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>
          </ClientPopoverContent>
        </ClientPopover>
      </div>

      {/* Activity List */}
      <ScrollArea className="rounded-md border" style={{ height: maxHeight }}>
        <div className="p-4 space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconClock className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {enterpriseSearch.query || selectedCategory ? "No events match your filters" : "No events recorded"}
              </p>
              {enterpriseSearch.error && (
                <p className="text-xs text-red-500 mt-2">
                  Search error: {enterpriseSearch.error}
                </p>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const category = getEventCategory(entry.eventType, entry.entityType);
              const Icon = category.icon;
              const actorDisplay = getActorDisplay(entry.actorType, entry.actorId);

              return (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  {/* Event Header */}
                  <div className="flex items-start gap-3">
                    {/* Event Icon */}
                    <div className={`p-2 rounded-md ${category.bgColor} shrink-0`}>
                      <Icon className={`h-4 w-4 ${category.color}`} />
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none mb-1">
                            {formatEventType(entry.eventType)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <IconUser className="h-3 w-3" />
                              {actorDisplay}
                            </span>
                            {entry.entityType && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <IconDatabase className="h-3 w-3" />
                                  {entry.entityType}
                                </span>
                              </>
                            )}
                            {entry.entityId && (
                              <>
                                <span>•</span>
                                <code className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">
                                  {entry.entityId.slice(0, 8)}
                                </code>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant={category.badgeVariant} className="shrink-0 text-[10px]">
                          {category.category}
                        </Badge>
                      </div>

                      {/* Timestamp and Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <IconClock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </div>

                        {(entry.details || entry.traceId) && (
                          <ClientPopover>
                            <ClientPopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <IconChevronRight className="h-3 w-3" />
                                Details
                              </Button>
                            </ClientPopoverTrigger>
                            <ClientPopoverContent className="w-96" align="end">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Event Details</h4>
                                  <dl className="space-y-2 text-xs">
                                    <div>
                                      <dt className="text-muted-foreground">Event ID</dt>
                                      <dd className="font-mono">{entry.id}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-muted-foreground">Timestamp</dt>
                                      <dd>{new Date(entry.createdAt).toLocaleString()}</dd>
                                    </div>
                                    {entry.traceId && (
                                      <div>
                                        <dt className="text-muted-foreground">Trace ID</dt>
                                        <dd className="font-mono">{entry.traceId}</dd>
                                      </div>
                                    )}
                                    {entry.ipAddress && (
                                      <div>
                                        <dt className="text-muted-foreground">IP Address</dt>
                                        <dd className="font-mono">{entry.ipAddress}</dd>
                                      </div>
                                    )}
                                  </dl>
                                </div>

                                {entry.details && Object.keys(entry.details).length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-sm mb-2">Additional Details</h4>
                                    <ScrollArea className="h-32 rounded border p-2 bg-muted/30">
                                      <pre className="text-[10px] font-mono">
                                        {JSON.stringify(entry.details, null, 2)}
                                      </pre>
                                    </ScrollArea>
                                  </div>
                                )}

                                <Button variant="outline" size="sm" className="w-full" asChild>
                                  <a href={routes.ui.admin.audit()}>
                                    <IconExternalLink className="mr-2 h-3 w-3" />
                                    View in Audit Log
                                  </a>
                                </Button>
                              </div>
                            </ClientPopoverContent>
                          </ClientPopover>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comment Section */}
                  <CommentSection auditLogId={entry.id} />
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredEntries.length} of {entries.length} events
        </span>
        <Button variant="link" size="sm" className="h-auto p-0" asChild>
          <a href={routes.ui.admin.audit()}>
            View full audit log
            <IconExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}
