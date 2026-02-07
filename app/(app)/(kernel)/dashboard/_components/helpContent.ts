/**
 * Dashboard Help Content Configuration
 * Centralized help content for all dashboard cards.
 */

import type { HelpContent } from "./CardHelpTooltip";

export const DASHBOARD_HELP_CONTENT: Record<string, HelpContent> = {
  "system-health": {
    title: "System Health",
    description: "Overall system health percentage calculated from the status of all monitored services.",
    details: [
      "Healthy services contribute 100% to the calculation",
      "Degraded services contribute 50%",
      "Down services contribute 0%",
      "Updated every 30 seconds automatically",
    ],
    learnMoreUrl: "/docs/monitoring/health",
  },
  
  "services": {
    title: "Registered Services",
    description: "Total number of services registered with the monitoring system.",
    details: [
      "Includes all active and inactive services",
      "Services auto-register when they start",
      "Unregistered services are not monitored",
      "View detailed status in Health page",
    ],
    learnMoreUrl: "/admin/health",
  },
  
  "system-status": {
    title: "System Status",
    description: "Current overall status of the entire system based on service health aggregation.",
    details: [
      "Healthy: All services running normally",
      "Degraded: Some services have issues but system is functional",
      "Down: Critical services are unavailable",
      "Status updates in real-time",
    ],
    learnMoreUrl: "/docs/monitoring/status",
  },
  
  "audit-events": {
    title: "Audit Events",
    description: "Recent system events tracked in the immutable audit log for security and compliance.",
    details: [
      "Events are captured automatically",
      "Immutable log - cannot be modified or deleted",
      "Retained for 90 days by default",
      "Export available in Audit page",
    ],
    learnMoreUrl: "/admin/audit",
  },
  
  "system-metrics": {
    title: "System Metrics",
    description: "Real-time visualization of system health metrics and service status breakdown.",
    details: [
      "Data refreshed every 30 seconds",
      "Historical data available for 24 hours",
      "Click metrics to see detailed trends",
      "Export data from admin panel",
    ],
    learnMoreUrl: "/docs/monitoring/metrics",
  },
  
  "quick-actions": {
    title: "Quick Actions",
    description: "Frequently used administrative tasks and system shortcuts based on your role.",
    details: [
      "Actions filtered by user permissions",
      "Most used actions appear first",
      "Personalized for your account",
      "Add custom actions in Settings",
    ],
    learnMoreUrl: "/docs/user-guide/quick-actions",
  },
  
  "recent-activity": {
    title: "Recent Activity",
    description: "Latest audit events and system activities ordered by timestamp.",
    details: [
      "Shows events from all services",
      "Real-time updates as events occur",
      "Click to view full event details",
      "Filter by event type in Audit page",
    ],
    learnMoreUrl: "/admin/audit",
  },
};
