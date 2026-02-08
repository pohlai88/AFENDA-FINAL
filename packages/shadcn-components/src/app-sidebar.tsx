"use client"

import * as React from "react"
import {
  ListTodo,
  Folder,
  Building2,
  Settings,
  LayoutDashboard,
} from "lucide-react"
import { routes } from "@afenda/shared/constants"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "./sidebar"

interface AppSidebarUser {
  name: string
  email: string
  avatar: string
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: AppSidebarUser | null }) {
  // AFENDA navigation — sidebar-07 pattern with collapsible groups
  const navMain = [
    {
      title: "Dashboard",
      url: routes.ui.orchestra.dashboard(),
      icon: LayoutDashboard,
    },
    {
      title: "MagicTodo",
      url: routes.ui.magictodo.dashboard(),
      icon: ListTodo,
      items: [
        { title: "Tasks", url: routes.ui.magictodo.tasks() },
        { title: "Projects", url: routes.ui.magictodo.projects() },
        { title: "Kanban", url: routes.ui.magictodo.kanban() },
        { title: "Calendar", url: routes.ui.magictodo.calendar() },
      ],
    },
    {
      title: "MagicDrive",
      url: routes.ui.magicdrive.root(),
      icon: Folder,
      items: [
        { title: "Files", url: routes.ui.magicdrive.root() },
        { title: "Recent", url: routes.ui.magicdrive.recent() },
        { title: "Starred", url: routes.ui.magicdrive.starred() },
      ],
    },
    {
      title: "Tenancy",
      url: routes.ui.tenancy.organizations.list(),
      icon: Building2,
      items: [
        { title: "Organizations", url: routes.ui.tenancy.organizations.list() },
        { title: "Teams", url: routes.ui.tenancy.teams.list() },
        { title: "Members", url: routes.ui.tenancy.memberships() },
      ],
    },
    {
      title: "Admin",
      url: routes.ui.admin.root(),
      icon: Settings,
      items: [
        { title: "Services", url: routes.ui.admin.services() },
        { title: "Health", url: routes.ui.admin.health() },
        { title: "Configuration", url: routes.ui.admin.config() },
      ],
    },
  ]

  // User data for footer
  const userData = {
    name: user?.name || "User",
    email: user?.email || "",
    avatar: user?.avatar || "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} label="AFENDA" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
