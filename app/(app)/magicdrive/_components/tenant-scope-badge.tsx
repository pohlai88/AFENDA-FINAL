/**
 * @domain magicdrive
 * @layer ui/components
 * @responsibility Display active tenant context with visual indicator
 * Phase 4: Replicates MagicTodo's TenantScopeBadge for MagicDrive pages.
 */

"use client"

import { useEffect, useState } from "react"
import { Badge } from "@afenda/shadcn"
import { Building2, Users } from "lucide-react"

interface TenantScopeBadgeProps {
  className?: string
}

export function TenantScopeBadge({ className }: TenantScopeBadgeProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTenant, setActiveTenant] = useState<{
    type: "org" | "team"
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard requires client-side mount flag
    setMounted(true)

    // Read active tenant from localStorage (set by TenantSwitcher)
    const updateActiveTenant = () => {
      const stored = localStorage.getItem("activeTenant")
      if (stored) {
        try {
          setActiveTenant(JSON.parse(stored))
        } catch {
          setActiveTenant(null)
        }
      } else {
        setActiveTenant(null)
      }
    }

    updateActiveTenant()

    // Listen for storage changes (when user switches tenant in another tab)
    window.addEventListener("storage", updateActiveTenant)

    // Custom event for same-window updates (TenantSwitcher dispatches this)
    window.addEventListener("tenant-changed", updateActiveTenant)

    return () => {
      window.removeEventListener("storage", updateActiveTenant)
      window.removeEventListener("tenant-changed", updateActiveTenant)
    }
  }, [])

  if (!mounted) {
    return null
  }

  if (!activeTenant) {
    return (
      <Badge variant="outline" className={className}>
        <Users className="mr-1.5 h-3.5 w-3.5" />
        Personal
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className={className}>
      {activeTenant.type === "org" ? (
        <Building2 className="mr-1.5 h-3.5 w-3.5" />
      ) : (
        <Users className="mr-1.5 h-3.5 w-3.5" />
      )}
      {activeTenant.name}
      <span className="ml-1.5 text-xs opacity-70">
        ({activeTenant.type === "org" ? "Organization" : "Team"})
      </span>
    </Badge>
  )
}
