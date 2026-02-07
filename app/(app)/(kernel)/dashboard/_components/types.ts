/**
 * Dashboard Types
 * Shared type definitions for dashboard components.
 *
 * @domain app
 * @layer types
 */

import * as React from "react";

export interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  adminOnly?: boolean;
}
