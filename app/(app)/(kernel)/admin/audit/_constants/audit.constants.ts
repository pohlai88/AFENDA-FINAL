/**
 * Audit Log Constants
 * Centralized configuration for audit log functionality.
 */

/**
 * Pagination configuration
 */
export const AUDIT_PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10,
} as const;

/**
 * Retention and compliance settings
 */
export const AUDIT_RETENTION = {
  DAYS: 365,
  DISPLAY_TEXT: "365 days",
  COMPLIANCE_YEARS: 1,
} as const;

/**
 * Display configuration
 */
export const AUDIT_DISPLAY = {
  MAX_DETAIL_LENGTH: 50,
  MAX_CELL_WIDTH: "max-w-[200px]",
  TRUNCATE_SUFFIX: "...",
} as const;

/**
 * Event type badge variants
 * Maps event types to shadcn badge variants
 */
export const AUDIT_EVENT_VARIANTS = {
  SUCCESS: {
    keywords: ["registered", "created", "success"],
    variant: "default" as const,
    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  },
  ERROR: {
    keywords: ["unregistered", "deleted", "failed", "error"],
    variant: "destructive" as const,
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  },
  INFO: {
    keywords: ["changed", "set", "updated", "modified"],
    variant: "secondary" as const,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  },
  SYSTEM: {
    keywords: ["backup", "restore", "maintenance"],
    variant: "outline" as const,
    className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
  },
} as const;

/**
 * Get badge configuration for event type
 */
export function getEventBadgeConfig(eventType: string) {
  const lowerEventType = eventType.toLowerCase();
  
  for (const [, config] of Object.entries(AUDIT_EVENT_VARIANTS)) {
    if (config.keywords.some(keyword => lowerEventType.includes(keyword))) {
      return config;
    }
  }
  
  return {
    variant: "outline" as const,
    className: "",
  };
}

/**
 * Format audit details for display
 */
export function formatAuditDetails(details: unknown): string {
  if (!details) return "";
  
  const jsonString = JSON.stringify(details);
  if (jsonString.length <= AUDIT_DISPLAY.MAX_DETAIL_LENGTH) {
    return jsonString;
  }
  
  return jsonString.slice(0, AUDIT_DISPLAY.MAX_DETAIL_LENGTH) + AUDIT_DISPLAY.TRUNCATE_SUFFIX;
}
