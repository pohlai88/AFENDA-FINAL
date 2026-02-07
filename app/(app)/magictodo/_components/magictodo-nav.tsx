/**
 * MagicTodo secondary nav: ScrollArea + Button links.
 * All hrefs from routes.ui.magictodo (no magic strings).
 *
 * @layer route-ui
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"
import { cn } from "@afenda/shared/utils"
import { routes } from "@afenda/shared/constants"
import { Button } from "@afenda/shadcn"
import { ScrollArea, ScrollBar } from "@afenda/shadcn"
import {
  LayoutDashboard,
  ListTodo,
  Kanban,
  Calendar,
  Table2,
  GanttChart,
  Target,
  GitBranch,
  FolderKanban,
  Settings,
} from "lucide-react"

const navItems = [
  {
    label: "Dashboard",
    href: routes.ui.magictodo.dashboard(),
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Tasks",
    href: routes.ui.magictodo.tasks(),
    icon: ListTodo,
  },
  {
    label: "Kanban",
    href: routes.ui.magictodo.kanban(),
    icon: Kanban,
  },
  {
    label: "Calendar",
    href: routes.ui.magictodo.calendar(),
    icon: Calendar,
  },
  {
    label: "Table",
    href: routes.ui.magictodo.table(),
    icon: Table2,
  },
  {
    label: "Gantt",
    href: routes.ui.magictodo.gantt(),
    icon: GanttChart,
  },
  {
    label: "Focus",
    href: routes.ui.magictodo.focus(),
    icon: Target,
  },
  {
    label: "Hierarchy",
    href: routes.ui.magictodo.hierarchy(),
    icon: GitBranch,
  },
  {
    label: "Projects",
    href: routes.ui.magictodo.projects(),
    icon: FolderKanban,
  },
  {
    label: "Settings",
    href: routes.ui.magictodo.settings(),
    icon: Settings,
  },
]

export function MagictodoNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="border-b">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-1 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)

            return (
              <Button
                key={item.href}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center gap-2 shrink-0",
                  active && "font-medium"
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}
