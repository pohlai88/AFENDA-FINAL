/**
 * MagicDrive secondary nav: Tabs (line variant) + ScrollArea.
 * All hrefs from routes.ui.magicdrive (no magic strings).
 *
 * @layer route-ui
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"
import { routes } from "@afenda/shared/constants"
import {
  ClientTabs,
  ClientTabsList,
  ClientTabsTrigger,
  ScrollArea,
} from "@afenda/shadcn"
import {
  LayoutDashboard,
  Folder,
  FileText,
  Image,
  Music,
  Video,
  Archive,
  Share2,
  Clock,
  Star,
  Trash2,
  Settings,
  Cloud,
  HardDrive,
  Copy,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: routes.ui.magicdrive.root(), icon: LayoutDashboard, exact: true },
  { label: "Inbox", href: routes.ui.magicdrive.inbox(), icon: Cloud },
  { label: "Duplicates", href: routes.ui.magicdrive.duplicates(), icon: Copy },
  { label: "Files", href: routes.ui.magicdrive.files(), icon: Folder },
  { label: "Documents", href: routes.ui.magicdrive.documents(), icon: FileText },
  { label: "Images", href: routes.ui.magicdrive.images(), icon: Image },
  { label: "Videos", href: routes.ui.magicdrive.videos(), icon: Video },
  { label: "Audio", href: routes.ui.magicdrive.audio(), icon: Music },
  { label: "Archives", href: routes.ui.magicdrive.archives(), icon: Archive },
  { label: "Shared", href: routes.ui.magicdrive.shared(), icon: Share2 },
  { label: "Recent", href: routes.ui.magicdrive.recent(), icon: Clock },
  { label: "Starred", href: routes.ui.magicdrive.starred(), icon: Star },
  { label: "Trash", href: routes.ui.magicdrive.trash(), icon: Trash2 },
  { label: "Storage", href: routes.ui.magicdrive.storage(), icon: HardDrive },
  { label: "Settings", href: routes.ui.magicdrive.settings(), icon: Settings },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

export function MagicdriveNav() {
  const pathname = usePathname()

  const activeValue =
    navItems.find((item) => isActive(pathname, item.href, item.exact))?.href ??
    pathname

  const tabListClassName =
    "inline-flex h-12 w-max shrink-0 items-center gap-0.5 rounded-none border-b border-transparent bg-transparent px-0"
  const tabTriggerClassName =
    "flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"

  return (
    <ScrollArea className="min-w-0 w-full">
      <ClientTabs
        value={activeValue}
        className="w-full"
        fallback={
          <div role="tablist" className={tabListClassName} aria-hidden>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={tabTriggerClassName}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        }
      >
        <ClientTabsList
          variant="line"
          className={tabListClassName}
        >
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <ClientTabsTrigger
                key={item.href}
                value={item.href}
                className={tabTriggerClassName}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </ClientTabsTrigger>
            )
          })}
        </ClientTabsList>
      </ClientTabs>
    </ScrollArea>
  )
}
