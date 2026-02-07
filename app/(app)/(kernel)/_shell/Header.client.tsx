"use client";

/**
 * Header Client Component
 * Handles search, notifications, and command palette trigger.
 *
 * @domain app
 * @layer ui/shell
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";

import {
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Kbd,
  Separator,
} from "@afenda/shadcn";

import type { NavTree } from "@afenda/orchestra";
import { routes } from "@afenda/shared/constants";
import { useCommandPalette } from "./CommandPalette.client";
import { BurgerMenu } from "./BurgerMenu.client";
import { AnimatedThemeToggler } from "@afenda/shadcn";

// Lazy load CommandPalette - only load when user opens it
const CommandPaletteClient = dynamic(
  () => import("./CommandPalette.client").then((mod) => mod.CommandPaletteClient),
  { ssr: false }
);

export interface HeaderClientProps {
  navTree: NavTree;
}

/**
 * Generate breadcrumbs from pathname.
 */
function useBreadcrumbs() {
  const pathname = usePathname();

  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    const breadcrumbs = segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return { href, label };
    });

    return breadcrumbs;
  }, [pathname]);
}

/**
 * Client Component for header interactivity.
 * Manages search trigger and command palette.
 */
export function HeaderClient({ navTree }: HeaderClientProps) {
  const breadcrumbs = useBreadcrumbs();
  const { open, setOpen } = useCommandPalette();

  // Keyboard shortcut for command palette
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev: boolean) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  return (
    <>
      {/* Burger Menu (mobile) */}
      <BurgerMenu />

      {/* Breadcrumbs */}
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={routes.ui.orchestra.dashboard()}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search trigger (⌘K) - shadcn command palette pattern */}
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Open command palette (⌘K)"
      >
        <IconSearch className="size-4" aria-hidden={true} />
        <span>Search</span>
        <Kbd className="ml-2" aria-hidden={true} suppressHydrationWarning>
          ⌘K
        </Kbd>
      </Button>

      {/* Mobile search button */}
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
      >
        <IconSearch className="size-4" />
        <span className="sr-only">Search</span>
      </Button>

      {/* Separator before theme toggle */}
      <Separator orientation="vertical" className="mx-2 h-6 hidden sm:block" />

      {/* Theme Toggle - following marketing effect */}
      <AnimatedThemeToggler className="rounded-md" />

      {/* Command Palette */}
      <CommandPaletteClient navTree={navTree} open={open} onOpenChange={setOpen} />
    </>
  );
}
