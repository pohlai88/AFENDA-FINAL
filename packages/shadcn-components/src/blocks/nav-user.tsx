"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./avatar"
import {
  ClientDropdownMenu,
  ClientDropdownMenuTrigger,
  ClientDropdownMenuContent,
  ClientDropdownMenuGroup,
  ClientDropdownMenuItem,
  ClientDropdownMenuLabel,
  ClientDropdownMenuSeparator,
} from "../client-radix"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../sidebar"

const SIDEBAR_BUTTON_CLASS =
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-12 text-sm group-data-[collapsible=icon]:p-0!"

/**
 * Static fallback for SSR/hydration: plain button with same layout as trigger.
 * Avoids any component (SidebarMenuButton, Avatar, etc.) that could emit different
 * server vs client markup and cause hydration mismatch.
 */
function NavUserFallback({
  name,
  email,
}: {
  name: string
  email: string
}) {
  return (
    <button
      type="button"
      aria-label="User menu"
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size="lg"
      className={SIDEBAR_BUTTON_CLASS}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-medium grayscale">
        CN
      </div>
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </div>
      <IconDotsVertical className="ml-auto size-4 shrink-0" />
    </button>
  )
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  const fallback = (
    <NavUserFallback name={user.name} email={user.email || "Not signed in"} />
  )

  const triggerContent = (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      <Avatar className="h-8 w-8 rounded-lg grayscale">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {user.email}
        </span>
      </div>
      <IconDotsVertical className="ml-auto size-4" />
    </SidebarMenuButton>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ClientDropdownMenu fallback={fallback}>
          <ClientDropdownMenuTrigger asChild>
            {triggerContent}
          </ClientDropdownMenuTrigger>
          <ClientDropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <ClientDropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </ClientDropdownMenuLabel>
            <ClientDropdownMenuSeparator />
            <ClientDropdownMenuGroup>
              <ClientDropdownMenuItem>
                <IconUserCircle />
                Account
              </ClientDropdownMenuItem>
              <ClientDropdownMenuItem>
                <IconCreditCard />
                Billing
              </ClientDropdownMenuItem>
              <ClientDropdownMenuItem>
                <IconNotification />
                Notifications
              </ClientDropdownMenuItem>
            </ClientDropdownMenuGroup>
            <ClientDropdownMenuSeparator />
            <ClientDropdownMenuItem>
              <IconLogout />
              Log out
            </ClientDropdownMenuItem>
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
