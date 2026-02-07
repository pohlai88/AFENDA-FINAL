"use client";

/**
 * Wraps the shell content with SidebarProvider so that SidebarTrigger (in Header)
 * and other sidebar hooks can access the context. Must be a client component
 * because useSidebar() and related hooks require client-side context.
 *
 * @domain app
 * @layer ui/shell
 */

import { SidebarProvider } from "@afenda/shadcn";

export function AppShellWithSidebarContext({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
