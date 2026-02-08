/**
 * @domain magicdrive
 * @layer ui
 * @responsibility magicdrive navigation sidebar using shadcn sidebar-10
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  FolderOpen,
  Inbox,
  Search,
  Star,
  Pin,
  Users,
  Share2,
  Archive,
  Trash2,
  Settings,
  HelpCircle,
  Plus,
  Clock,
  CheckCircle,
  FolderClosed,
  LayoutGrid,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { routes } from "@afenda/shared/constants"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  isActive?: boolean
}

const quickAccessItems: NavItem[] = [
  {
    title: "All Documents",
    url: routes.ui.magicdrive.root(),
    icon: FileText,
  },
  {
    title: "Search",
    url: routes.ui.magicdrive.search(),
    icon: Search,
  },
]

const statusItems: NavItem[] = [
  {
    title: "Inbox",
    url: routes.ui.magicdrive.inbox(),
    icon: Inbox,
  },
  {
    title: "Active",
    url: `${routes.ui.magicdrive.root()}?status=active`,
    icon: CheckCircle,
  },
  {
    title: "Archived",
    url: `${routes.ui.magicdrive.root()}?status=archived`,
    icon: Archive,
  },
]

const smartFiltersItems: NavItem[] = [
  {
    title: "Starred",
    url: `${routes.ui.magicdrive.root()}?starred=true`,
    icon: Star,
  },
  {
    title: "Pinned",
    url: `${routes.ui.magicdrive.root()}?pinned=true`,
    icon: Pin,
  },
  {
    title: "Shared with me",
    url: `${routes.ui.magicdrive.root()}?sharedWithMe=true`,
    icon: Users,
  },
  {
    title: "Shared by me",
    url: `${routes.ui.magicdrive.root()}?sharedByMe=true`,
    icon: Share2,
  },
  {
    title: "Recent",
    url: `${routes.ui.magicdrive.root()}?sort=updatedAt-desc`,
    icon: Clock,
  },
]

const organizationItems: NavItem[] = [
  {
    title: "Collections",
    url: routes.ui.magicdrive.collections(),
    icon: FolderClosed,
  },
  {
    title: "Duplicates",
    url: routes.ui.magicdrive.duplicates(),
    icon: LayoutGrid,
  },
  {
    title: "Unsorted",
    url: routes.ui.magicdrive.unsorted(),
    icon: FolderOpen,
  },
]

const secondaryItems: NavItem[] = [
  {
    title: "Trash",
    url: `${routes.ui.magicdrive.root()}?status=deleted`,
    icon: Trash2,
  },
  {
    title: "Settings",
    url: routes.ui.magicdrive.settings(),
    icon: Settings,
  },
  {
    title: "Help",
    url: "#",
    icon: HelpCircle,
  },
]

export function magicdriveSidebar() {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- component name follows package convention
  const pathname = usePathname()

  const isActive = (url: string) => {
    const magicdriveRoot = routes.ui.magicdrive.root()
    if (url === magicdriveRoot) {
      return pathname === url || pathname === magicdriveRoot
    }
    return pathname.startsWith(url.split("?")[0])
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">magicdrive</span>
            <span className="text-xs text-muted-foreground">Document Management</span>
          </div>
        </div>
        <div className="px-2 pb-2">
          <Button className="w-full justify-start gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Access */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Access</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickAccessItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Status */}
        <SidebarGroup>
          <SidebarGroupLabel>Status</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {statusItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Smart Filters */}
        <SidebarGroup>
          <SidebarGroupLabel>Smart Filters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {smartFiltersItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Organization */}
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {organizationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {secondaryItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
