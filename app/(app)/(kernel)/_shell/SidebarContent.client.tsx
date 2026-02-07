"use client";

/**
 * Sidebar with NavUser Footer - Client Component
 * Renders a sidebar compatible with SidebarProvider context.
 * This is a simpler approach that ensures NavUser has access to the sidebar context.
 *
 * @domain app
 * @layer ui/shell
 */

import * as React from "react";
import { Suspense } from "react";
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

interface SidebarMainProps {
  userData: {
    name: string;
    email: string;
    avatar: string;
  };
  shellHealth: ShellHealth;
  availableDomains: AppDomainEntry[];
}

/**
 * Nav icon component
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
 * Domains navigation
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
 * Footer content - wrapped in Suspense to ensure context is available
 */
function SidebarFooterContent({ userData, shellHealth }: { userData: SidebarMainProps["userData"], shellHealth: ShellHealth }) {
  return (
    <SidebarFooter>
      <HealthIndicatorClient initialHealth={shellHealth} />
      <NavUser user={userData} />
    </SidebarFooter>
  );
}

/**
 * Main sidebar content
 */
export function SidebarClientContent({
  userData,
  shellHealth,
  availableDomains,
}: SidebarMainProps) {
  return (
    <Sidebar collapsible="icon">
      {/* Header */}
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

      {/* Content */}
      <SidebarContent>
        <DomainsNav domains={availableDomains} />
      </SidebarContent>

      {/* Footer - wrapped in Suspense */}
      <Suspense fallback={<div className="h-12" />}>
        <SidebarFooterContent userData={userData} shellHealth={shellHealth} />
      </Suspense>

      {/* Rails */}
      <SidebarRail />
    </Sidebar>
  );
}
