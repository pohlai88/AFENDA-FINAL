/**
 * Header Server Component
 * Renders header with breadcrumbs and user info.
 *
 * @domain app
 * @layer ui/shell
 */

import * as React from "react";
import {
  SidebarTrigger,
  Separator,
} from "@afenda/shadcn";

import type { NavTree } from "@afenda/orchestra";
import { HeaderClient } from "./Header.client";

export interface HeaderServerProps {
  navTree: NavTree;
}

/**
 * Server Component that renders the header structure.
 * Passes data to client component for search and notifications.
 */
export function HeaderServer({ navTree }: HeaderServerProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <HeaderClient navTree={navTree} />
      </div>
    </header>
  );
}
