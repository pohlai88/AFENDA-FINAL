"use client";

/**
 * App Site Header - dashboard-01 pattern.
 * Composable header with SidebarTrigger, optional left/right slots.
 * Uses design tokens (--header-height). No hardcoded values.
 */

import * as React from "react";
import { cn } from "../lib/utils";
import { Separator } from "../separator";
import { SidebarTrigger } from "../sidebar";

export interface AppSiteHeaderProps extends React.ComponentProps<"header"> {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function AppSiteHeader({
  leftContent,
  rightContent,
  className,
  children,
  ...props
}: AppSiteHeaderProps) {
  return (
    <header
      data-slot="app-site-header"
      className={cn(
        "flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear",
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]",
        className
      )}
      {...props}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {leftContent}
        <div className="flex-1" />
        {rightContent}
        {children}
      </div>
    </header>
  );
}
