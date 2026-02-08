"use client";

/**
 * Header Content Component
 * Breadcrumbs + Search (⌘K) + Theme toggle.
 * Follows shadcn sidebar-07 header pattern.
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
  AnimatedThemeToggler,
} from "@afenda/shadcn";

import { routes } from "@afenda/shared/constants";
import { useCommandPalette } from "../(kernel)/_shell/CommandPalette.client";

// Lazy load CommandPalette - only load when user opens it
const CommandPaletteClient = dynamic(
  () => import("../(kernel)/_shell/CommandPalette.client").then((mod) => mod.CommandPaletteClient),
  { ssr: false }
);

/**
 * Generate breadcrumbs from pathname.
 */
function useBreadcrumbs() {
  const pathname = usePathname();

  return React.useMemo(() => {
    return pathname
      .split("/")
      .filter((s) => s && !s.startsWith("(") && !s.includes("["))
      .map((segment, index, arr) => ({
        href: "/" + arr.slice(0, index + 1).join("/"),
        label: segment
          .replace(/[-_]/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      }));
  }, [pathname]);
}

/**
 * Header content — breadcrumbs, search trigger, theme toggle.
 */
export function HeaderContent() {
  const breadcrumbs = useBreadcrumbs();
  const { open, setOpen } = useCommandPalette();

  // ⌘K keyboard shortcut
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
      {/* Breadcrumbs */}
      <Breadcrumb className="hidden md:block">
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

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search trigger (⌘K) */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-muted-foreground min-w-[200px] justify-start"
          onClick={() => setOpen(true)}
          aria-label="Open command palette (⌘K)"
        >
          <IconSearch className="size-4" aria-hidden />
          <span className="flex-1 text-left">Search...</span>
          <Kbd className="ml-auto" aria-hidden suppressHydrationWarning>
            ⌘K
          </Kbd>
        </Button>

        {/* Mobile search */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setOpen(true)}
          aria-label="Search"
        >
          <IconSearch className="size-4" />
        </Button>

        {/* Theme Toggle */}
        <AnimatedThemeToggler className="rounded-md" />
      </div>

      {/* Command Palette */}
      <CommandPaletteClient
        navTree={{ services: [], user: null, tenant: null, timestamp: new Date().toISOString() }}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
