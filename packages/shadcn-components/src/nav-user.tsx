"use client"

import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
} from "lucide-react"
import { authClient } from "@afenda/auth/client"
import { routes } from "@afenda/shared/constants"

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
} from "./client-radix"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./sidebar"

/** User initials for avatar fallback (e.g. "John Doe" → "JD"). */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"
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
  const router = useRouter()
  const initials = getInitials(user.name)

  async function handleSignOut() {
    await authClient.signOut()
    router.push(routes.ui.auth.login())
  }

  const triggerContent = (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {user.email}
        </span>
      </div>
      <ChevronsUpDown className="ml-auto size-4" />
    </SidebarMenuButton>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ClientDropdownMenu>
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
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
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
                <BadgeCheck />
                Account
              </ClientDropdownMenuItem>
              <ClientDropdownMenuItem>
                <CreditCard />
                Billing
              </ClientDropdownMenuItem>
              <ClientDropdownMenuItem>
                <Bell />
                Notifications
              </ClientDropdownMenuItem>
            </ClientDropdownMenuGroup>
            <ClientDropdownMenuSeparator />
            <ClientDropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Log out
            </ClientDropdownMenuItem>
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
