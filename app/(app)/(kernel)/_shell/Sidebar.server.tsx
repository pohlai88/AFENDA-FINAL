/**
 * Sidebar Server Component
 * Renders navigation tree from server-side data using sidebar-07 structure.
 * Separates server data fetching from client rendering.
 *
 * @domain app
 * @layer ui/shell
 */

import "server-only";
import type { NavTree, ShellHealth, AppDomainEntry } from "@afenda/orchestra";
import { SidebarClientWrapper } from "./SidebarClientWrapper";

export interface SidebarServerProps {
  navTree: NavTree;
  shellHealth: ShellHealth;
  /** Discovered from app/(app)/ route segments + domain.config.json (no hardcoding). */
  availableDomains: AppDomainEntry[];
}

/**
 * Server Component that renders the sidebar structure using sidebar-07 design.
 * Combines AFENDA branding with collapsible domain navigation.
 * Fetches server-side data and passes to client component for rendering.
 */
export function SidebarServer({ navTree, shellHealth, availableDomains }: SidebarServerProps) {
  // Format user data for NavUser component
  const userData = navTree.user ? {
    name: navTree.user.name || "User",
    email: navTree.user.email || "",
    avatar: navTree.user.avatar || "",
  } : {
    name: "User",
    email: "",
    avatar: "",
  };

  // Pass data to client component for rendering
  return (
    <SidebarClientWrapper
      userData={userData}
      shellHealth={shellHealth}
      availableDomains={availableDomains}
    />
  );
}
