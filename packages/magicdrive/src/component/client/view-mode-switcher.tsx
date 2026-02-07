/**
 * @layer domain (magicdrive)
 * @responsibility View mode switcher component.
 */

"use client"

import * as React from "react"
import { Grid, LayoutList, Rows3 } from "lucide-react"
import { cn } from "@afenda/shared/utils"
import type { ViewMode } from "../../zustand/magicdrive.store.zustand"

export interface ViewModeSwitcherProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

export function ViewModeSwitcher({
  mode,
  onChange,
  className,
}: ViewModeSwitcherProps) {
  return (
    <div className={cn("flex items-center border rounded-md", className)}>
      <ViewModeButton
        icon={<Grid className="h-4 w-4" />}
        label="Grid"
        isActive={mode === "grid"}
        onClick={() => onChange("grid")}
      />
      <ViewModeButton
        icon={<Rows3 className="h-4 w-4" />}
        label="List"
        isActive={mode === "list"}
        onClick={() => onChange("list")}
      />
      <ViewModeButton
        icon={<LayoutList className="h-4 w-4" />}
        label="Columns"
        isActive={mode === "columns"}
        onClick={() => onChange("columns")}
      />
    </div>
  )
}

interface ViewModeButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function ViewModeButton({
  icon,
  label,
  isActive,
  onClick,
}: ViewModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50 text-muted-foreground"
      )}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
    >
      {icon}
    </button>
  )
}
