/**
 * @layer domain (magicdrive)
 * @responsibility Breadcrumb navigation component.
 */

"use client"

import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@afenda/shared/utils"
import type { Folder } from "../../zod/magicdrive.folder.zod"

export interface BreadcrumbsProps {
  folders: Folder[]
  onNavigate: (folderId: string | null) => void
  className?: string
}

export function Breadcrumbs({
  folders,
  onNavigate,
  className,
}: BreadcrumbsProps) {
  return (
    <nav
      className={cn("flex items-center gap-1 text-sm", className)}
      aria-label="Breadcrumb"
    >
      {/* Home/root */}
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">All Documents</span>
      </button>

      {/* Folder path */}
      {folders.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={cn(
              "px-2 py-1 rounded transition-colors truncate max-w-[150px]",
              index === folders.length - 1
                ? "font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            title={folder.name}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  )
}
