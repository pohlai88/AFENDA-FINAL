/**
 * Dashboard Utilities
 * Shared utility functions for dashboard components and pages.
 *
 * @domain app
 * @layer utility
 */

interface HealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
}

interface SystemHealthData {
  summary?: HealthSummary;
  uptime?: number;
  status?: string;
}

interface HealthHistoryEntry {
  id: string;
  serviceId: string;
  status: string;
  latencyMs: number | null;
  errorMessage: string | null;
  recordedAt: string;
}

/**
 * Format uptime in human-readable format.
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format relative time.
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Calculate health percentage from health check data.
 */
export function calculateHealthPercentage(health: SystemHealthData | null): number {
  if (!health?.summary) return 0;
  return Math.round((health.summary.healthy / Math.max(health.summary.total, 1)) * 100);
}

/**
 * Transform health history entries for chart display.
 * Note: Currently using status-based approximation since healthPercentage
 * is not stored in the history entries.
 */
export function transformHealthHistory(
  entries: HealthHistoryEntry[]
): Array<{ timestamp: Date; value: number }> {
  return entries.map((entry) => {
    // Approximate health percentage based on status
    let value = 0;
    if (entry.status === "healthy") value = 100;
    else if (entry.status === "degraded") value = 70;
    else if (entry.status === "down") value = 0;
    
    return {
      timestamp: new Date(entry.recordedAt),
      value,
    };
  });
}

/**
 * Calculate metric change statistics.
 */
export function calculateMetricChange(
  currentValue: number,
  previousValue: number
): {
  change: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
} {
  const change = currentValue - previousValue;
  const changePercent =
    previousValue > 0 ? Math.round((change / previousValue) * 100) : 0;
  
  let trend: "up" | "down" | "stable" = "stable";
  if (currentValue >= 90) trend = "up";
  else if (currentValue >= 70) trend = "stable";
  else trend = "down";

  return { change, changePercent, trend };
}
