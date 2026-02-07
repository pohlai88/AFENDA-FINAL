/**
 * Global Navigation Configuration
 * Centralized configuration for sidebar and burger menu navigation.
 * Auto-fetches available pages and provides structured navigation.
 *
 * @domain kernel
 * @layer config
 */

import {
  IconHome,
  IconHeart,
  IconSettings,
  IconShield,
  IconDatabase,
  IconServer,
  IconChartBar,
  IconFolder,
  IconChecklist,
  IconFileText,
  IconLayoutDashboard,
  IconCloud,
  type Icon,
} from "@tabler/icons-react";

import { routes } from "@afenda/shared/constants";

/**
 * Navigation item definition.
 */
export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  icon: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

/**
 * Navigation group definition.
 */
export interface NavGroupConfig {
  id: string;
  label: string;
  items: NavItemConfig[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/**
 * Domain navigation configuration.
 */
export interface DomainNavConfig {
  id: string;
  label: string;
  groups: NavGroupConfig[];
  order: number;
}

/**
 * Icon name to component mapping.
 */
export const ICON_MAP: Record<string, Icon> = {
  home: IconHome,
  dashboard: IconLayoutDashboard,
  health: IconHeart,
  settings: IconSettings,
  shield: IconShield,
  database: IconDatabase,
  server: IconServer,
  chart: IconChartBar,
  folder: IconFolder,
  checklist: IconChecklist,
  file: IconFileText,
  cloud: IconCloud,
};

/**
 * App domains are fetched from the registry (getAvailableDomains) like kernel fetches services.
 * See orchestra_app_domains table and @afenda/orchestra getAvailableDomains.
 */

/**
 * Sidebar domain display aliases (id → label).
 * Only list of domains is auto-generated; these aliases are for display only.
 */
export const SIDEBAR_DOMAIN_ALIASES: Record<string, string> = {
  "(kernel)": "M-Configuration",
  magicdrive: "M-Repo",
  magictodo: "M-Task",
};

/** Sidebar label for the domains section (domain list). */
export const SIDEBAR_DOMAINS_SECTION_LABEL = "AFENDA";

/**
 * Kernel Admin Navigation (always available).
 * Full list for Quick Navigation / burger menu / command palette.
 */
export const KERNEL_ADMIN_NAV: NavGroupConfig = {
  id: "admin",
  label: "Administration",
  collapsible: true,
  defaultOpen: true,
  items: [
    {
      id: "admin-dashboard",
      label: "Admin Dashboard",
      href: routes.ui.admin.root(),
      icon: "dashboard",
      description: "Administration overview and quick actions",
    },
    {
      id: "admin-health",
      label: "System Health",
      href: routes.ui.admin.health(),
      icon: "health",
      description: "Monitor system health and diagnostics",
    },
    {
      id: "admin-services",
      label: "Service Registry",
      href: routes.ui.admin.services(),
      icon: "server",
      description: "Manage registered services",
    },
    {
      id: "admin-config",
      label: "Configuration",
      href: routes.ui.admin.config(),
      icon: "settings",
      description: "System configuration management",
    },
    {
      id: "admin-audit",
      label: "Audit Log",
      href: routes.ui.admin.audit(),
      icon: "shield",
      description: "View system audit trail",
    },
    {
      id: "admin-backup",
      label: "Backup & Restore",
      href: routes.ui.admin.backup(),
      icon: "database",
      description: "Database backup management",
    },
    {
      id: "admin-admins",
      label: "Admin Assignments",
      href: routes.ui.admin.admins(),
      icon: "shield",
      description: "Primary admin, delegated admins, and RBAC",
    },
  ],
};

/**
 * Sidebar-only: registries (lists) only.
 * Individual sub-pages (Dashboard, Health, Audit, Backup, Admin Assignments) are reached via Quick Navigation.
 */
export const SIDEBAR_REGISTRY_NAV: NavGroupConfig = {
  id: "registries",
  label: "Registries",
  collapsible: true,
  defaultOpen: true,
  items: [
    {
      id: "admin-services",
      label: "Service Registry",
      href: routes.ui.admin.services(),
      icon: "server",
      description: "Manage registered services",
    },
    {
      id: "admin-config",
      label: "Configuration",
      href: routes.ui.admin.config(),
      icon: "settings",
      description: "System configuration management",
    },
  ],
};

/**
 * Quick access items for burger menu.
 * Top-level app pages for fast navigation.
 */
export const QUICK_ACCESS_NAV: NavItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: routes.ui.orchestra.dashboard(),
    icon: "dashboard",
    description: "Main dashboard",
  },
  ...KERNEL_ADMIN_NAV.items,
];

/**
 * Get all navigation items as a flat list.
 * Useful for search and command palette.
 */
export function getAllNavItems(): NavItemConfig[] {
  return [
    {
      id: "dashboard",
      label: "Dashboard",
      href: routes.ui.orchestra.dashboard(),
      icon: "dashboard",
      description: "Main dashboard",
    },
    ...KERNEL_ADMIN_NAV.items,
  ];
}

/**
 * Get navigation items grouped by domain.
 */
export function getNavByDomain(): DomainNavConfig[] {
  return [
    {
      id: "kernel",
      label: "System",
      order: 0,
      groups: [
        {
          id: "main",
          label: "Main",
          items: [
            {
              id: "dashboard",
              label: "Dashboard",
              href: routes.ui.orchestra.dashboard(),
              icon: "dashboard",
            },
          ],
        },
        KERNEL_ADMIN_NAV,
      ],
    },
  ];
}

/**
 * Find navigation item by href.
 */
export function findNavItemByHref(href: string): NavItemConfig | undefined {
  return getAllNavItems().find((item) => item.href === href);
}

/**
 * Check if a path matches a navigation item.
 */
export function isActiveNavItem(itemHref: string, currentPath: string): boolean {
  if (itemHref === routes.ui.orchestra.dashboard()) {
    return currentPath === routes.ui.orchestra.dashboard();
  }
  return currentPath.startsWith(itemHref);
}
