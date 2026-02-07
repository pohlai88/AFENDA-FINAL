"use client";

/**
 * Burger Menu Dropdown Component
 * Quick navigation dropdown for app-level pages.
 *
 * @domain kernel
 * @layer ui/shell
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconMenu2,
  IconHome,
  IconHeart,
  IconSettings,
  IconShield,
  IconDatabase,
  IconServer,
  IconLayoutDashboard,
  IconChevronRight,
} from "@tabler/icons-react";

import {
  Button,
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuLabel,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
  ClientDropdownMenuGroup,
} from "@afenda/shadcn";

import {
  QUICK_ACCESS_NAV,
  isActiveNavItem,
  type NavItemConfig,
} from "./navigation.config";

/**
 * Icon component based on icon name.
 */
function NavIcon({ name, className }: { name: string; className?: string }) {
  const iconName = name?.toLowerCase();
  switch (iconName) {
    case "home":
      return <IconHome className={className} />;
    case "dashboard":
      return <IconLayoutDashboard className={className} />;
    case "health":
      return <IconHeart className={className} />;
    case "settings":
      return <IconSettings className={className} />;
    case "shield":
      return <IconShield className={className} />;
    case "database":
      return <IconDatabase className={className} />;
    case "server":
      return <IconServer className={className} />;
    default:
      return <IconHome className={className} />;
  }
}

/**
 * Single menu item component.
 */
function MenuItem({ item, isActive }: { item: NavItemConfig; isActive: boolean }) {
  return (
    <ClientDropdownMenuItem asChild>
      <Link
        href={item.href}
        className={`flex items-center gap-3 ${isActive ? "bg-accent" : ""}`}
      >
        <NavIcon name={item.icon} className="size-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="font-medium">{item.label}</span>
          {item.description && (
            <span className="text-xs text-muted-foreground">{item.description}</span>
          )}
        </div>
        {isActive && (
          <IconChevronRight className="ml-auto size-4 text-muted-foreground" />
        )}
      </Link>
    </ClientDropdownMenuItem>
  );
}

/**
 * Burger Menu Dropdown for quick navigation.
 * Shows all available app-level pages.
 */
export function BurgerMenu() {
  const pathname = usePathname();

  // Separate dashboard from admin items
  const dashboardItem = QUICK_ACCESS_NAV.find((item) => item.id === "dashboard");
  const adminItems = QUICK_ACCESS_NAV.filter((item) => item.id !== "dashboard");

  return (
    <ClientDropdownMenu>
      <ClientDropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconMenu2 className="size-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </ClientDropdownMenuTrigger>
      <ClientDropdownMenuContent align="start" className="w-64">
        <ClientDropdownMenuLabel>Quick Navigation</ClientDropdownMenuLabel>
        <ClientDropdownMenuSeparator />

        {/* Dashboard */}
        {dashboardItem && (
          <>
            <MenuItem
              item={dashboardItem}
              isActive={isActiveNavItem(dashboardItem.href, pathname)}
            />
            <ClientDropdownMenuSeparator />
          </>
        )}

        {/* Admin Pages */}
        <ClientDropdownMenuGroup>
          <ClientDropdownMenuLabel className="text-xs text-muted-foreground">
            Administration
          </ClientDropdownMenuLabel>
          {adminItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              isActive={isActiveNavItem(item.href, pathname)}
            />
          ))}
        </ClientDropdownMenuGroup>
      </ClientDropdownMenuContent>
    </ClientDropdownMenu>
  );
}
