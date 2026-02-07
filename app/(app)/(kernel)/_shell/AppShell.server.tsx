import "server-only";

import { getNavTree, getShellHealth } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import {
  SidebarInset,
  SidebarMain,
  SidebarMainContent,
} from "@afenda/shadcn";

import { getAvailableDomainsFromApp } from "./domains.discovery";
import { AppShellWithSidebarContext } from "./AppShellWithSidebarContext";
import { SidebarServer } from "./Sidebar.server";
import { HeaderServer } from "./Header.server";

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell Server Component
 * Main wrapper that fetches nav tree and renders Server Components.
 *
 * @domain app
 * @layer ui/shell
 * 
 * Architecture note: SidebarProvider has been moved from this level into
 * SidebarClientWrapper (a client component) because useSidebar() is a client
 * hook that requires access to the context at client-side render time. Server-side
 * context providers cannot make their values available to client-side hooks.
 * This ensures proper context propagation for all useSidebar() calls in NavUser
 * and other sidebar components.
 */
export async function AppShell({ children }: AppShellProps) {
  const [navResult, healthResult, availableDomains] = await Promise.all([
    getNavTree({ db }),
    getShellHealth({ db }),
    Promise.resolve(getAvailableDomainsFromApp()),
  ]);

  // Handle errors gracefully - render shell with empty nav
  const navTree = navResult.ok ? navResult.data : {
    services: [],
    user: null,
    tenant: null,
    timestamp: new Date().toISOString(),
  };

  const shellHealth = healthResult.ok ? healthResult.data : {
    status: "down" as const,
    serviceCount: 0,
    healthyCount: 0,
    degradedCount: 0,
    downCount: 0,
  };

  return (
    <AppShellWithSidebarContext>
      <SidebarServer
        navTree={navTree}
        shellHealth={shellHealth}
        availableDomains={availableDomains}
      />
      <SidebarInset>
        <HeaderServer navTree={navTree} />
        <SidebarMain>
          <SidebarMainContent>{children}</SidebarMainContent>
        </SidebarMain>
      </SidebarInset>
    </AppShellWithSidebarContext>
  );
}
