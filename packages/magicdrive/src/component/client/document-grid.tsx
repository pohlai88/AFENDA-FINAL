/**
 * @layer domain (magicdrive)
 * @responsibility Document grid view component.
 */

"use client"

import * as React from "react"
import { cn } from "@afenda/shared/utils"
import type { Document } from "../../zod/magicdrive.document.zod"
import { DocumentCard } from "./document-card"

export interface DocumentGridProps {
  documents: Document[]
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onDocumentClick: (document: Document) => void
  onToggleStar?: (id: string) => void
  columns?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function DocumentGrid({
  documents,
  selectedIds,
  onSelect,
  onDocumentClick,
  onToggleStar,
  columns = 4,
  className,
}: DocumentGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No documents found</p>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          isSelected={selectedIds.has(doc.id)}
          onSelect={() => onSelect(doc.id)}
          onClick={() => onDocumentClick(doc)}
          onToggleStar={onToggleStar ? () => onToggleStar(doc.id) : undefined}
        />
      ))}
    </div>
  )
}
