"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { routes } from "@afenda/shared/constants"
import {
  MoreHorizontal,
  Inbox,
  Copy,
  Search,
  FolderOpen,
  Settings,
  FileCheck2,
  ListChecks,
  FolderKanban,
  LayoutDashboard,
  Package,
  BarChart3,
  ShieldCheck,
  Building2,
  Users,
  Palette,
  Key,
} from "lucide-react"

import { Button } from "../button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../popover"
import { Separator } from "../separator"

// Use shared routes from @afenda/shared/constants

type DomainNavItem = {
  icon: React.ElementType
  label: string
  href: string
}

type DomainConfig = {
  title: string
  items: DomainNavItem[]
}

function useDomainConfig(): DomainConfig | null {
  const pathname = usePathname()

  if (pathname.startsWith(routes.ui.magicdrive.root())) {
    return {
      title: "MagicDrive",
      items: [
        { icon: LayoutDashboard, label: "Overview", href: routes.ui.magicdrive.landing() },
        { icon: Inbox, label: "Inbox", href: routes.ui.magicdrive.inbox() },
        { icon: Copy, label: "Duplicates", href: routes.ui.magicdrive.duplicates() },
        { icon: FolderOpen, label: "Unsorted", href: routes.ui.magicdrive.unsorted() },
        { icon: Search, label: "Search", href: routes.ui.magicdrive.search() },
        { icon: FolderKanban, label: "Collections", href: routes.ui.magicdrive.collections() },
        { icon: FileCheck2, label: "Audit", href: routes.ui.magicdrive.audit() },
        { icon: Settings, label: "Settings", href: routes.ui.magicdrive.settings() },
      ],
    }
  }

  if (
    pathname.startsWith(routes.ui.magictodo.tasks()) ||
    pathname.startsWith(routes.ui.magictodo.projects())
  ) {
    return {
      title: "MagicTodo",
      items: [
        { icon: ListChecks, label: "Tasks", href: routes.ui.magictodo.tasks() },
        { icon: FolderKanban, label: "Projects", href: routes.ui.magictodo.projects() },
      ],
    }
  }

  if (pathname.startsWith(routes.ui.tenancy.root())) {
    return {
      title: "Tenancy",
      items: [
        { icon: Building2, label: "Organizations", href: routes.ui.tenancy.organizations.list() },
        { icon: Users, label: "Teams", href: routes.ui.tenancy.teams.list() },
      ],
    }
  }

  if (pathname.startsWith(routes.ui.settings.root())) {
    return {
      title: "Settings",
      items: [
        { icon: Palette, label: "Design System", href: routes.ui.settings.designSystem() },
        { icon: Key, label: "Sessions", href: routes.ui.settings.sessions() },
      ],
    }
  }

  if (pathname.startsWith(routes.ui.orchestra.root())) {
    return {
      title: "App",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: routes.ui.orchestra.dashboard() },
        { icon: Package, label: "Modules", href: routes.ui.orchestra.modules() },
        { icon: BarChart3, label: "Analytics", href: routes.ui.orchestra.analytics() },
        { icon: ShieldCheck, label: "Approvals", href: routes.ui.orchestra.approvals() },
      ],
    }
  }

  return null
}

export function DomainMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const domainConfig = useDomainConfig()

  if (!domainConfig) {
    return null
  }

  const handleItemClick = (item: DomainNavItem) => {
    router.push(item.href)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Domain menu"
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          {domainConfig.title}
        </div>
        <Separator className="my-1" />
        <div className="flex flex-col">
          {domainConfig.items.map((item) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => handleItemClick(item)}
                className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors ${isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
