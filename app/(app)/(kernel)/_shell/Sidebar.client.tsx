"use client";

/**
 * Sidebar Client Component
 * Handles client-side interactivity (collapse state, mobile responsive).
 * Enterprise-ready user configuration with proper routing and theme management.
 *
 * @domain app
 * @layer ui/shell
 */

import * as React from "react";
import Link from "next/link";
import { IconUser, IconLogout, IconSettings, IconMoon, IconSun, IconBell, IconSelector } from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { routes } from "@afenda/shared/constants";
import {
  ClientDropdownMenu as DropdownMenu,
  ClientDropdownMenuContent as DropdownMenuContent,
  ClientDropdownMenuItem as DropdownMenuItem,
  ClientDropdownMenuLabel as DropdownMenuLabel,
  ClientDropdownMenuSeparator as DropdownMenuSeparator,
  ClientDropdownMenuTrigger as DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Switch,
} from "@afenda/shadcn";

import type { NavTree } from "@afenda/orchestra";

export interface SidebarClientProps {
  navTree: NavTree;
}

/**
 * Client Component for sidebar user menu and interactivity.
 * Manages collapse state via cookie (handled by SidebarProvider).
 * Enterprise-ready with theme management, notifications, and proper routing.
 */
export function SidebarClient({ navTree }: SidebarClientProps) {
  const user = navTree.user;
  const { theme, setTheme } = useTheme();
  const { isMobile } = useSidebar();

  // Get initials for avatar fallback
  const userName = user?.name;
  const initials = React.useMemo(() => {
    if (!userName) return "U";
    return userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [userName]);

  // Get user role badge color - commented out until role is added to user schema
  // const getRoleBadgeVariant = (role?: string) => {
  //   switch (role) {
  //     case "admin":
  //       return "destructive";
  //     case "super_admin":
  //       return "destructive";
  //     case "user":
  //       return "secondary";
  //     default:
  //       return "outline";
  //   }
  // };

  return (
    <div className="flex w-full items-center gap-1">
      <SidebarMenu className="flex-1 min-w-0">
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {user?.avatar && <AvatarImage src={user.avatar} alt={user.name ?? "User"} />}
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.name ?? "Guest"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email ?? "Not signed in"}
                  </span>
                </div>
                <IconSelector className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user?.avatar && <AvatarImage src={user.avatar} alt={user.name ?? "User"} />}
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.name ?? "Guest"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email ?? "Not signed in"}
                  </span>
                </div>
                {/* Role badge - commented out until role is added to user schema */}
                {/* {user?.role && (
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                    {user.role.replace("_", " ")}
                  </Badge>
                )} */}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* User Profile Section — links use routes.ui.orchestra.settings() for /settings */}
            <DropdownMenuItem asChild>
              <Link href={routes.ui.orchestra.settings()}>
                <IconUser className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={routes.ui.orchestra.settings()}>
                <IconSettings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            {/* Notifications */}
            <DropdownMenuItem>
              <IconBell className="mr-2 h-4 w-4" />
              Notifications
              <Badge variant="secondary" className="ml-auto text-xs">3</Badge>
            </DropdownMenuItem>

            {/* Admin Section - commented out until role is added to user schema */}
            {/* {user?.role === "admin" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <IconShield className="mr-2 h-4 w-4" />
                  Administration
                </DropdownMenuItem>
              </>
            )} */}

            <DropdownMenuSeparator />

            {/* Theme Toggle */}
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                {theme === "dark" ? (
                  <IconMoon className="h-4 w-4" />
                ) : (
                  <IconSun className="h-4 w-4" />
                )}
                <span className="text-sm">Theme</span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                size="sm"
              />
            </div>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem className="text-destructive">
              <IconLogout className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarTrigger
        className="shrink-0 size-8 rounded-md group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-8"
        aria-label="Toggle sidebar (menu)"
      />
    </div>
  );
}
