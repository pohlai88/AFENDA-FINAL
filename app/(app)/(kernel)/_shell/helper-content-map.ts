/**
 * Helper Content Map
 * Static route-to-content mapping for contextual help.
 */

import { routes } from "@afenda/shared/constants"

export interface HelperContent {
  title: string;
  description: string;
  quickTips: string[];
  commonTasks: {
    label: string;
    action: () => void;
    icon?: string;
  }[];
  relatedDocs: {
    label: string;
    href: string;
  }[];
}

export const HELPER_CONTENT_MAP: Record<string, HelperContent> = {
  "/admin": {
    title: "Admin Overview",
    description: "Central hub for system administration and monitoring",
    quickTips: [
      "Use the sidebar to jump to Health, Config, Audit, Backup, or Admins",
      "System health and recent audit are summarized here",
      "Quick links to common admin workflows",
    ],
    commonTasks: [
      {
        label: "View System Health",
        action: () => { window.location.href = routes.ui.admin.health(); },
      },
      {
        label: "Open Configuration",
        action: () => { window.location.href = routes.ui.admin.config(); },
      },
      {
        label: "View Audit Log",
        action: () => { window.location.href = routes.ui.admin.audit(); },
      },
    ],
    relatedDocs: [
      { label: "Dashboard", href: routes.ui.orchestra.dashboard() },
      { label: "Health", href: routes.ui.admin.health() },
      { label: "Config", href: routes.ui.admin.config() },
    ],
  },

  "/admin/admins": {
    title: "Admin Assignments",
    description: "Manage delegated admins, roles, and primary admin",
    quickTips: [
      "Assign roles per admin: Config Manager, Backup Manager, Audit Viewer, etc.",
      "Only one primary admin; transfer carefully",
      "Changes here are audited",
    ],
    commonTasks: [
      {
        label: "Add Delegated Admin",
        action: () => window.dispatchEvent(new CustomEvent("open-delegated-admin-dialog")),
      },
      {
        label: "View Audit Log",
        action: () => { window.location.href = routes.ui.admin.audit(); },
      },
    ],
    relatedDocs: [
      { label: "Admin Overview", href: routes.ui.admin.root() },
      { label: "Audit Log", href: routes.ui.admin.audit() },
    ],
  },

  "/admin/services": {
    title: "Service Registry",
    description: "Registered services and their health",
    quickTips: [
      "Services self-register with the kernel",
      "Health checks run automatically",
      "Use audit log to see registration and health change events",
    ],
    commonTasks: [
      {
        label: "View Health Dashboard",
        action: () => { window.location.href = routes.ui.admin.health(); },
      },
      {
        label: "View Audit Log",
        action: () => { window.location.href = routes.ui.admin.audit(); },
      },
    ],
    relatedDocs: [
      { label: "Health", href: routes.ui.admin.health() },
      { label: "Audit", href: routes.ui.admin.audit() },
    ],
  },

  "/dashboard": {
    title: "Dashboard Overview",
    description: "Your central hub for system monitoring and quick actions",
    quickTips: [
      "View system health status at a glance",
      "Access recent audit events",
      "Quick links to all admin sections",
    ],
    commonTasks: [
      {
        label: "View System Health",
        action: () => { window.location.href = routes.ui.admin.health(); },
      },
      {
        label: "Check Audit Log",
        action: () => { window.location.href = routes.ui.admin.audit(); },
      },
    ],
    relatedDocs: [],
  },

  "/admin/config": {
    title: "Configuration Management",
    description: "Manage system and tenant configuration settings",
    quickTips: [
      "Use templates for quick setup instead of manual entry",
      "All configuration changes are audited automatically",
      "Configurations are scoped: Global, Tenant, or Service",
    ],
    commonTasks: [
      {
        label: "Browse Templates",
        action: () => { window.location.href = routes.ui.admin.configTemplates(); },
      },
      {
        label: "Create Custom Config",
        action: () => window.dispatchEvent(new CustomEvent("open-config-create")),
      },
    ],
    relatedDocs: [
      {
        label: "View Configuration Templates",
        href: routes.ui.admin.configTemplates(),
      },
      {
        label: "Admin Dashboard",
        href: routes.ui.admin.root(),
      },
    ],
  },

  "/admin/config/templates": {
    title: "Configuration Templates",
    description: "Pre-built templates for common configuration scenarios",
    quickTips: [
      "15+ templates across System, Tenant, Service, and Compliance categories",
      "Environment presets for Production, Development, and Staging",
      "All templates include validation and helpful hints",
    ],
    commonTasks: [
      {
        label: "Apply Production Preset",
        action: () => window.dispatchEvent(new CustomEvent("apply-preset", { detail: "production" })),
      },
      {
        label: "Back to Config",
        action: () => { window.location.href = routes.ui.admin.config(); },
      },
    ],
    relatedDocs: [
      {
        label: "Back to Configuration",
        href: routes.ui.admin.config(),
      },
      {
        label: "Admin Dashboard",
        href: routes.ui.admin.root(),
      },
    ],
  },

  "/admin/health": {
    title: "System Health Monitoring",
    description: "Monitor service health and system diagnostics",
    quickTips: [
      "Services self-register with the kernel at startup",
      "Health checks run automatically every 30 seconds",
      "Failed health checks trigger alerts",
    ],
    commonTasks: [
      {
        label: "Refresh Health Status",
        action: () => window.location.reload(),
      },
      {
        label: "View Diagnostics",
        action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
      },
    ],
    relatedDocs: [
      {
        label: "View Audit Log",
        href: routes.ui.admin.audit(),
      },
      {
        label: "Admin Dashboard",
        href: routes.ui.admin.root(),
      },
    ],
  },

  "/admin/audit": {
    title: "Audit Log",
    description: "Immutable record of all system events",
    quickTips: [
      "Audit logs are immutable and retained for 365 days",
      "All configuration changes are automatically logged",
      "Use filters to narrow down specific events",
    ],
    commonTasks: [
      {
        label: "Export Audit Log",
        action: () => window.dispatchEvent(new CustomEvent("export-audit")),
      },
      {
        label: "Clear Filters",
        action: () => { window.location.href = routes.ui.admin.audit(); },
      },
    ],
    relatedDocs: [
      {
        label: "View System Health",
        href: routes.ui.admin.health(),
      },
      {
        label: "Admin Dashboard",
        href: routes.ui.admin.root(),
      },
    ],
  },

  "/admin/backup": {
    title: "Backup & Restore",
    description: "Manage system backups and recovery",
    quickTips: [
      "Schedule daily backups for production environments",
      "Test restore procedures quarterly",
      "Store backups in multiple locations",
    ],
    commonTasks: [
      {
        label: "Create Backup Now",
        action: () => window.dispatchEvent(new CustomEvent("trigger-backup")),
      },
      {
        label: "View Backup History",
        action: () => { window.location.href = `${routes.ui.admin.audit()}?eventType=backup`; },
      },
    ],
    relatedDocs: [
      {
        label: "View Audit Log",
        href: routes.ui.admin.audit(),
      },
      {
        label: "Admin Dashboard",
        href: routes.ui.admin.root(),
      },
    ],
  },
};

/**
 * Get helper content for a route.
 * Tries exact match, then longest matching prefix (e.g. /admin/config/templates/xyz → /admin/config/templates).
 */
export function getHelperContent(pathname: string): HelperContent {
  if (HELPER_CONTENT_MAP[pathname]) {
    return HELPER_CONTENT_MAP[pathname];
  }
  // Prefix match for nested routes
  const sortedPaths = Object.keys(HELPER_CONTENT_MAP).filter(p => pathname.startsWith(p + "/"));
  const best = sortedPaths.sort((a, b) => b.length - a.length)[0];
  if (best) {
    return HELPER_CONTENT_MAP[best];
  }

  return {
    title: "Help & Support",
    description: "Get help with the current page",
    quickTips: [
      "Press Cmd/Ctrl + K to open the command palette",
      "All admin pages have contextual help available",
      "Check the audit log for recent system events",
    ],
    commonTasks: [
      {
        label: "Start Onboarding Tour",
        action: () => window.dispatchEvent(new CustomEvent("start-onboarding")),
      },
      {
        label: "Go to Dashboard",
        action: () => { window.location.href = routes.ui.orchestra.dashboard(); },
      },
    ],
    relatedDocs: [],
  };
}
