"use client"

/**
 * Thin wrapper that bridges the app-layer user context into the
 * prop-driven AppSidebar UI component from @afenda/shadcn.
 *
 * @layer app/components
 */

import { useUser } from "@/app/_components/user-context"
import { AppSidebar } from "@afenda/shadcn/app-sidebar"

export function AppSidebarWrapper() {
  const { user } = useUser()

  const sidebarUser = user
    ? { name: user.name, email: user.email, avatar: user.avatar || "" }
    : null

  return <AppSidebar user={sidebarUser} />
}
