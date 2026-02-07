/**
 * Onboarding Wizard Content
 * Step definitions for the kernel admin onboarding flow.
 */

import { IconSettings, IconHeartbeat, IconCommand, IconRocket } from "@tabler/icons-react";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof IconSettings;
  content: string[];
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
  }[];
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Kernel Admin",
    description: "Your central hub for system management and configuration",
    icon: IconRocket,
    content: [
      "The Kernel Admin provides powerful tools to manage your system infrastructure",
      "Configure settings, monitor health, manage backups, and review audit logs",
      "All changes are tracked and require appropriate permissions",
    ],
  },
  {
    id: "configuration",
    title: "Configuration Templates",
    description: "Quick setup with pre-built templates",
    icon: IconSettings,
    content: [
      "Browse 15+ pre-built configuration templates across 4 categories",
      "Apply environment presets (Production, Development, Staging) with one click",
      "All configurations are validated and changes are audited automatically",
    ],
    actions: [
      {
        label: "Browse Templates",
        href: "/admin/config/templates",
      },
    ],
  },
  {
    id: "health",
    title: "Health Monitoring",
    description: "Track system and service health",
    icon: IconHeartbeat,
    content: [
      "Monitor health status of all registered services in real-time",
      "Services self-register with the kernel at startup",
      "Automatic health checks run every 30 seconds with alerts on failures",
    ],
    actions: [
      {
        label: "View Health Dashboard",
        href: "/admin/health",
      },
    ],
  },
  {
    id: "shortcuts",
    title: "Quick Actions",
    description: "Keyboard shortcuts and command palette",
    icon: IconCommand,
    content: [
      "Press Cmd/Ctrl + K to open the command palette from anywhere",
      "Quickly navigate to any admin page or configuration",
      "Search across all system settings and documentation",
    ],
  },
];

export const ONBOARDING_STORAGE_KEY = "kernel-onboarding-completed";
