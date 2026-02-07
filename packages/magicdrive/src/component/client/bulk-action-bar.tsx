/**
 * @layer domain (magicdrive)
 * @responsibility Bulk action bar component.
 */

"use client"

import * as React from "react"
import {
  Archive,
  Download,
  FolderInput,
  MoreHorizontal,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"
import type { BulkDocumentAction } from "../../server/magicdrive.bulk.server"

export interface BulkActionBarProps {
  selectedCount: number
  onAction: (action: BulkDocumentAction) => void
  onClear: () => void
  className?: string
}

export function BulkActionBar({
  selectedCount,
  onAction,
  onClear,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-2 bg-background border rounded-full shadow-lg",
        className
      )}
    >
      {/* Selection count */}
      <span className="text-sm font-medium px-2">
        {selectedCount} selected
      </span>

      <div className="h-4 w-px bg-border" />

      {/* Quick actions */}
      <BulkActionButton
        icon={<Star className="h-4 w-4" />}
        label="Star"
        onClick={() => onAction("star")}
      />
      <BulkActionButton
        icon={<Tag className="h-4 w-4" />}
        label="Tag"
        onClick={() => onAction("add-tag")}
      />
      <BulkActionButton
        icon={<FolderInput className="h-4 w-4" />}
        label="Move"
        onClick={() => onAction("move")}
      />
      <BulkActionButton
        icon={<Download className="h-4 w-4" />}
        label="Download"
        onClick={() => onAction("download")}
      />
      <BulkActionButton
        icon={<Archive className="h-4 w-4" />}
        label="Archive"
        onClick={() => onAction("archive")}
      />
      <BulkActionButton
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete"
        onClick={() => onAction("delete")}
        variant="destructive"
      />

      <div className="h-4 w-px bg-border" />

      {/* Clear selection */}
      <button
        onClick={onClear}
        className="p-2 hover:bg-accent rounded-full transition-colors"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface BulkActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: "default" | "destructive"
}

function BulkActionButton({
  icon,
  label,
  onClick,
  variant = "default",
}: BulkActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors",
        variant === "destructive"
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-accent"
      )}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
