"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Building2, Users, Plus } from "lucide-react"
import { useMembershipsQuery } from "@afenda/tenancy"
import { routes } from "@afenda/shared/constants"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./sidebar"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type ActiveTenant = {
  type: "org" | "team"
  id: string
  name: string
}

type ServerTenant = {
  type: "org" | "team" | null
  id: string | null
  organizationId?: string
}

/* -------------------------------------------------------------------------- */
/*  Hook: resolve active tenant                                               */
/* -------------------------------------------------------------------------- */

/**
 * Resolve active tenant from server cookie + memberships.
 * Falls back to first org membership when no cookie is set.
 * NEVER returns a permanent loading state — always resolves.
 */
function useActiveTenant(memberships: Array<Record<string, unknown>> | undefined) {
  const [activeTenant, setActiveTenant] = React.useState<ActiveTenant | null>(null)
  const [resolved, setResolved] = React.useState(false)

  React.useEffect(() => {
    if (!memberships) return // wait for memberships to load first

    let cancelled = false

    async function resolve() {
      try {
        const res = await fetch(routes.api.tenancy.tenant.active())
        const serverTenant: ServerTenant = await res.json()

        if (cancelled) return

        // Cookie has valid tenant — try to match in memberships
        if (serverTenant?.id && serverTenant?.type) {
          const match = memberships!.find((m: Record<string, unknown>) =>
            serverTenant.type === "org"
              ? m.organizationId === serverTenant.id
              : m.teamId === serverTenant.id
          )
          if (match) {
            setActiveTenant({
              type: serverTenant.type,
              id: serverTenant.id,
              name:
                serverTenant.type === "org"
                  ? (match.orgName as string) || "Organization"
                  : (match.teamName as string) || "Team",
            })
            setResolved(true)
            return
          }
        }
      } catch {
        // fetch failed — fall through to fallback
      }

      if (cancelled) return

      // Fallback: pick first org membership
      const firstOrg = memberships!.find(
        (m: Record<string, unknown>) => m.organizationId && !m.teamId
      )
      if (firstOrg) {
        setActiveTenant({
          type: "org",
          id: firstOrg.organizationId as string,
          name: (firstOrg.orgName as string) || "Organization",
        })
      }
      // Always mark as resolved even if no memberships exist
      setResolved(true)
    }

    resolve()
    return () => { cancelled = true }
  }, [memberships])

  return { activeTenant, setActiveTenant, resolved }
}

/* -------------------------------------------------------------------------- */
/*  TeamSwitcher (sidebar-07 pattern)                                         */
/* -------------------------------------------------------------------------- */

/**
 * TenantSwitcher for sidebar — displays active tenant context.
 * Allows switching between organizations and teams.
 *
 * Follows shadcn sidebar-07 `TeamSwitcher` layout:
 * - Logo square + name/subtitle + chevron trigger
 * - Dropdown with grouped items + keyboard shortcuts
 * - "Add team" action at the bottom
 */
export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const router = useRouter()

  // Fetch user's memberships
  const { data, isLoading } = useMembershipsQuery({ page: 1, limit: 100 })

  // Resolve active tenant (never stays stuck)
  const { activeTenant, setActiveTenant, resolved } = useActiveTenant(
    data?.items as Array<Record<string, unknown>> | undefined
  )

  // ---- derived lists (stable between renders) ----
  const orgMemberships = React.useMemo(
    () => data?.items?.filter((m) => m.organizationId && !m.teamId) ?? [],
    [data?.items]
  )
  const teamMemberships = React.useMemo(
    () => data?.items?.filter((m) => m.teamId) ?? [],
    [data?.items]
  )

  // ---- tenant switch handler ----
  const switchTenant = React.useCallback(
    async (type: "org" | "team", id: string, name: string, organizationId?: string) => {
      setActiveTenant({ type, id, name })
      window.dispatchEvent(new Event("tenant-changed"))
      try {
        await fetch(routes.api.tenancy.tenant.switchBff(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id, organizationId }),
        })
        router.refresh()
      } catch (error) {
        console.error("Failed to switch tenant:", error)
      }
    },
    [router, setActiveTenant]
  )

  // ---- loading skeleton (only while memberships query is in-flight) ----
  if (isLoading && !resolved) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg animate-pulse">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="bg-muted h-3.5 w-24 rounded animate-pulse" />
              <span className="bg-muted h-3 w-16 rounded animate-pulse mt-1" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // ---- no memberships: direct to create org ----
  if (resolved && !activeTenant) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => router.push(routes.ui.tenancy.organizations.list())}
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Create Organization</span>
              <span className="truncate text-xs">Get started</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Guard — should not happen at this point, but keeps TS happy
  if (!activeTenant) return null

  const Icon = activeTenant.type === "org" ? Building2 : Users
  const subtitle = activeTenant.type === "org" ? "Organization" : "Team"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTenant.name}</span>
                <span className="truncate text-xs">{subtitle}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {/* Organizations */}
            {orgMemberships.length > 0 && (
              <>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Organizations
                </DropdownMenuLabel>
                {orgMemberships.map((membership, index) => (
                  <DropdownMenuItem
                    key={membership.id}
                    onClick={() =>
                      switchTenant(
                        "org",
                        membership.organizationId!,
                        membership.orgName || "Organization"
                      )
                    }
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <Building2 className="size-3.5 shrink-0" />
                    </div>
                    {membership.orgName || "Organization"}
                    {activeTenant.type === "org" &&
                      activeTenant.id === membership.organizationId && (
                        <div className="ml-auto size-1.5 rounded-full bg-primary" />
                      )}
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Teams */}
            {teamMemberships.length > 0 && (
              <>
                {orgMemberships.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Teams
                </DropdownMenuLabel>
                {teamMemberships.map((membership, index) => (
                  <DropdownMenuItem
                    key={membership.id}
                    onClick={() =>
                      switchTenant(
                        "team",
                        membership.teamId!,
                        membership.teamName || "Team",
                        membership.organizationId || undefined
                      )
                    }
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <Users className="size-3.5 shrink-0" />
                    </div>
                    {membership.teamName || "Team"}
                    {activeTenant.type === "team" &&
                      activeTenant.id === membership.teamId && (
                        <div className="ml-auto size-1.5 rounded-full bg-primary" />
                      )}
                    <DropdownMenuShortcut>⌘{orgMemberships.length + index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Create new organization */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => router.push(routes.ui.tenancy.organizations.list())}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Create organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
