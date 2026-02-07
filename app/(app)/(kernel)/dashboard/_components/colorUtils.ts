/**
 * Color Utilities for Dashboard
 * Provides semantic color mappings using CSS variables from globals.css
 * This ensures consistency with the design system and theme support.
 *
 * @domain app
 * @layer util
 */

/**
 * Get semantic color class for status indicators
 */
export function getStatusColor(status: "success" | "warning" | "error" | "info"): string {
  switch (status) {
    case "success":
      return "text-chart-1"; // Green tones from chart-1
    case "warning":
      return "text-chart-3"; // Yellow/amber tones from chart-3
    case "error":
      return "text-destructive"; // Red tones from destructive
    case "info":
      return "text-chart-2"; // Blue tones from chart-2
    default:
      return "text-muted-foreground";
  }
}

/**
 * Get semantic background color class for status indicators
 */
export function getStatusBgColor(status: "success" | "warning" | "error" | "info"): string {
  switch (status) {
    case "success":
      return "bg-chart-1/10";
    case "warning":
      return "bg-chart-3/10";
    case "error":
      return "bg-destructive/10";
    case "info":
      return "bg-chart-2/10";
    default:
      return "bg-muted";
  }
}

/**
 * Get trend indicator color (for metrics)
 */
export function getTrendColor(trend: "up" | "down" | "stable"): string {
  switch (trend) {
    case "up":
      return "text-chart-1"; // Positive trend - green
    case "down":
      return "text-destructive"; // Negative trend - red
    case "stable":
      return "text-muted-foreground"; // Neutral - gray
    default:
      return "text-muted-foreground";
  }
}

/**
 * Get service health status color
 */
export function getHealthColor(type: "healthy" | "degraded" | "down"): string {
  switch (type) {
    case "healthy":
      return "text-chart-1";
    case "degraded":
      return "text-chart-3";
    case "down":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}
