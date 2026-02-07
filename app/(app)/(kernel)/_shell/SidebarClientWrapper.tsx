"use client";

/**
 * Sidebar Client Wrapper Component
 * Renders the complete sidebar with all client-side functionality.
 * SidebarProvider is provided by AppShellWithSidebarContext at the shell level
 * so that both the Sidebar and Header (SidebarTrigger) have access to context.
 *
 * @domain app
 * @layer ui/shell
 */

import * as React from "react";
import Link from "next/link";
import { AfendaIcon } from "@afenda/marketing";
import { routes } from "@afenda/shared/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  NavUser,
} from "@afenda/shadcn";
import type { ShellHealth, AppDomainEntry } from "@afenda/orchestra";
import { HealthIndicatorClient } from "./HealthIndicator.client";
import { SIDEBAR_DOMAIN_ALIASES, SIDEBAR_DOMAINS_SECTION_LABEL } from "./navigation.config";

import {
  IconHome,
  IconSettings,
  IconHeart,
  IconServer,
  IconFileText,
  IconDatabase,
  IconShield,
  IconChartBar,
  IconFolder,
  IconChecklist,
} from "@tabler/icons-react";

export interface SidebarClientWrapperProps {
  userData: {
    name: string;
    email: string;
    avatar: string;
  };
  shellHealth: ShellHealth;
  availableDomains: AppDomainEntry[];
}

/**
 * Nav icon component - renders icon based on name.
 * Memoized to prevent unnecessary re-renders.
 */
const NavIcon = React.memo(function NavIcon({
  name,
  className
}: {
  name?: string;
  className?: string;
}) {
  const iconName = name?.toLowerCase();
  switch (iconName) {
    case "home":
      return <IconHome className={className} />;
    case "settings":
      return <IconSettings className={className} />;
    case "health":
      return <IconHeart className={className} />;
    case "server":
      return <IconServer className={className} />;
    case "database":
      return <IconDatabase className={className} />;
    case "shield":
      return <IconShield className={className} />;
    case "chart":
      return <IconChartBar className={className} />;
    case "folder":
      return <IconFolder className={className} />;
    case "checklist":
      return <IconChecklist className={className} />;
    case "file":
    default:
      return <IconFileText className={className} />;
  }
});

/**
 * App domains navigation — displays domains from server data.
 */
const DomainsNav = React.memo(function DomainsNav({
  domains,
}: {
  domains: AppDomainEntry[];
}) {
  if (domains.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{SIDEBAR_DOMAINS_SECTION_LABEL}</SidebarGroupLabel>
      <SidebarMenu>
        {domains.map((domain) => {
          const label = SIDEBAR_DOMAIN_ALIASES[domain.id] ?? domain.label;
          return (
            <SidebarMenuItem key={domain.id}>
              <SidebarMenuButton asChild tooltip={label}>
                <Link href={domain.href}>
                  <NavIcon name={domain.icon} className="size-4" />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
});

/**
 * Client component that renders the complete sidebar.
 * All rendering happens on the client where context is properly available.
 */
export function SidebarClientWrapper({
  userData,
  shellHealth,
  availableDomains,
}: SidebarClientWrapperProps) {
  return (
    <Sidebar collapsible="icon">
        {/* Header with AFENDA branding */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                tooltip="Afenda"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Link href={routes.ui.orchestra.dashboard()}>
                  <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground [&>svg]:size-4 [&>svg]:min-w-0">
                    <AfendaIcon className="size-full text-primary" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Afenda</span>
                    <span className="truncate text-xs text-muted-foreground">MACHINA · VITAE</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Main navigation content */}
        <SidebarContent>
          <DomainsNav domains={availableDomains} />
        </SidebarContent>

        {/* Footer with user menu and health indicator */}
        <SidebarFooter>
          <HealthIndicatorClient initialHealth={shellHealth} />
          <NavUser user={userData} />
        </SidebarFooter>

        {/* Sidebar rail for collapsed state icons */}
        <SidebarRail />
      </Sidebar>
  );
}
