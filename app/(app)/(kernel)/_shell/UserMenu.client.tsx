"use client";

/**
 * User Menu Component
 * Dropdown menu with user info, settings, and logout.
 *
 * @domain app
 * @layer ui/shell
 */

import * as React from "react";
import Link from "next/link";
import {
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconShield,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { routes } from "@afenda/shared/constants";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuGroup,
  ClientDropdownMenuItem,
  ClientDropdownMenuLabel,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
  Badge,
} from "@afenda/shadcn";

import { useUser, getUserInitials } from "@/app/_components/user-context";

export function UserMenu() {
  const { user, isLoading } = useUser();
  const { theme, setTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    );
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href={routes.ui.auth.login()}>Sign In</Link>
      </Button>
    );
  }

  return (
    <div suppressHydrationWarning>
      <ClientDropdownMenu>
        <ClientDropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 px-2"
          >
            <Avatar className="size-7">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="text-xs">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline-block max-w-[100px] truncate text-sm">
              {user.name}
            </span>
            <IconChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </ClientDropdownMenuTrigger>
        <ClientDropdownMenuContent align="end" className="w-56">
          <ClientDropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              <Badge variant="outline" className="mt-1 w-fit text-xs capitalize">
                {user.role}
              </Badge>
            </div>
          </ClientDropdownMenuLabel>
          <ClientDropdownMenuSeparator />
          <ClientDropdownMenuGroup>
            <ClientDropdownMenuItem asChild>
              <Link href={routes.ui.orchestra.settings()} className="cursor-pointer">
                <IconUser className="mr-2 size-4" />
                Profile
              </Link>
            </ClientDropdownMenuItem>
            <ClientDropdownMenuItem asChild>
              <Link href={routes.ui.orchestra.settings()} className="cursor-pointer">
                <IconSettings className="mr-2 size-4" />
                Settings
              </Link>
            </ClientDropdownMenuItem>
            {user.role === "admin" && (
              <ClientDropdownMenuItem asChild>
                <Link href={routes.ui.admin.root()} className="cursor-pointer">
                  <IconShield className="mr-2 size-4" />
                  Administration
                </Link>
              </ClientDropdownMenuItem>
            )}
          </ClientDropdownMenuGroup>
          <ClientDropdownMenuSeparator />
          <ClientDropdownMenuItem
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="cursor-pointer"
          >
            {theme === "dark" ? (
              <>
                <IconSun className="mr-2 size-4" />
                Light Mode
              </>
            ) : (
              <>
                <IconMoon className="mr-2 size-4" />
                Dark Mode
              </>
            )}
          </ClientDropdownMenuItem>
          <ClientDropdownMenuSeparator />
          <ClientDropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={() => {
              // TODO: Implement logout via auth service
            }}
          >
            <IconLogout className="mr-2 size-4" />
            Log out
          </ClientDropdownMenuItem>
        </ClientDropdownMenuContent>
      </ClientDropdownMenu>
    </div>
  );
}
