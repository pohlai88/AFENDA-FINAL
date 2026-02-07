/**
 * Quick Actions Definitions
 * Centralized definition of all dashboard quick actions
 * 
 * @domain app
 * @layer constants
 */

import {
  IconActivity,
  IconServer,
  IconShield,
  IconDatabase,
  IconTemplate,
  IconSettings,
} from "@tabler/icons-react";
import { routes } from "@afenda/shared/constants";
import type { QuickAction } from "./types";

export const ALL_ACTIONS: QuickAction[] = [
  {
    id: "view-health",
    label: "System Health",
    href: routes.ui.admin.health(),
    icon: IconActivity,
    description: "Monitor system status",
  },
  {
    id: "view-audit",
    label: "Audit Log",
    href: routes.ui.admin.audit(),
    icon: IconShield,
    description: "Review system events",
  },
  {
    id: "manage-backup",
    label: "Backup",
    href: routes.ui.admin.backup(),
    icon: IconDatabase,
    description: "Manage backups",
    adminOnly: true,
  },
  {
    id: "manage-config",
    label: "Configuration",
    href: routes.ui.admin.config(),
    icon: IconSettings,
    description: "System settings",
    adminOnly: true,
  },
  {
    id: "view-templates",
    label: "Templates",
    href: routes.ui.admin.configTemplates(),
    icon: IconTemplate,
    description: "Config templates",
    adminOnly: true,
  },
  {
    id: "manage-services",
    label: "Services",
    href: routes.ui.admin.health(),
    icon: IconServer,
    description: "Service control",
    adminOnly: true,
  },
];
