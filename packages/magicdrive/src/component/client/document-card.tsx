/**
 * @layer domain (magicdrive)
 * @responsibility Document card component for grid view.
 */

"use client"

import * as React from "react"
import { Check, File, FileText, Image, MoreVertical, Star } from "lucide-react"
import { cn } from "@afenda/shared/utils"
import type { Document } from "../../zod/magicdrive.document.zod"
import { DOCUMENT_TYPE_ICONS } from "../../constant/magicdrive.constants"

export interface DocumentCardProps {
  document: Document
  isSelected: boolean
  onSelect: () => void
  onClick: () => void
  onToggleStar?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  showCheckbox?: boolean
  className?: string
}

export function DocumentCard({
  document,
  isSelected,
  onSelect,
  onClick,
  onToggleStar,
  onContextMenu,
  showCheckbox = true,
  className,
}: DocumentCardProps) {
  const Icon = getDocumentIcon(document.type)

  return (
    <div
      className={cn(
        "group relative flex flex-col border rounded-lg overflow-hidden cursor-pointer transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50",
        className
      )}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-[4/3] bg-muted">
        {document.thumbnailUrl ? (
          <img
            src={document.thumbnailUrl}
            alt={document.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Icon className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Selection checkbox */}
        {showCheckbox && (
          <button
            className={cn(
              "absolute top-2 left-2 h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
              isSelected
                ? "bg-primary border-primary"
                : "border-muted-foreground/50 bg-background/80 opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </button>
        )}

        {/* Star button */}
        {onToggleStar && (
          <button
            className={cn(
              "absolute top-2 right-2 p-1 rounded-full transition-all",
              document.isStarred
                ? "text-yellow-500"
                : "text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-yellow-500"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar()
            }}
          >
            <Star
              className={cn("h-4 w-4", document.isStarred && "fill-current")}
            />
          </button>
        )}

        {/* File type badge */}
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-xs bg-background/80 text-foreground">
          {document.mimeType?.split("/")[1]?.toUpperCase() || document.type.toUpperCase()}
        </div>
      </div>

      {/* Info area */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h3 className="font-medium text-sm truncate" title={document.name}>
          {document.name}
        </h3>
        {document.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {document.description}
          </p>
        )}
      </div>
    </div>
  )
}

function getDocumentIcon(type: string) {
  switch (type) {
    case "file":
      return File
    case "note":
      return FileText
    case "template":
      return FileText
    default:
      return File
  }
}
