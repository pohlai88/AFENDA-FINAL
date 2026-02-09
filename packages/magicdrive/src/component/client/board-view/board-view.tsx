/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Board (Kanban) view for documents using official shadcn Kanban
 */

"use client"

import { useMemo, useState } from "react"
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { CardDescription, CardTitle } from "@afenda/shadcn"
import type { DocumentItem } from "@afenda/magicdrive/zustand"
import { formatFileSize } from "@afenda/magicdrive/constant"
import { DocumentActionsDropdown } from "../ui/document-actions-dropdown"
import { DocumentPreviewHover } from "../ui/document-preview-hover"

interface BoardViewProps {
  documents: DocumentItem[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
}

type KanbanDocumentItem = {
  id: string
  name: string
  column: string
  document: DocumentItem
}

const COLUMNS = [
  { id: "inbox", name: "Inbox" },
  { id: "active", name: "Active" },
  { id: "archived", name: "Archived" },
]

export function BoardView({ documents, selectedIds, onToggleSelection }: BoardViewProps) {
  const initialData = useMemo<KanbanDocumentItem[]>(() =>
    documents.map(doc => ({
      id: doc.id,
      name: doc.title || "Untitled",
      column: doc.status || "inbox",
      document: doc,
    })), [documents])

  const [kanbanData, setKanbanData] = useState<KanbanDocumentItem[]>(initialData)

  // Check if we're in the browser
  if (typeof window === "undefined") {
    return <div className="h-full w-full bg-muted/50 animate-pulse" />
  }

  return (
    <KanbanProvider
      columns={COLUMNS}
      data={kanbanData}
      onDataChange={setKanbanData}
      className="h-full"
    >
      {column => (
        <KanbanBoard id={column.id} key={column.id}>
          <KanbanHeader>
            {column.name}
            <Badge variant="secondary">
              {kanbanData.filter(item => item.column === column.id).length}
            </Badge>
          </KanbanHeader>
          <KanbanCards<KanbanDocumentItem> id={column.id}>
            {(item) => {
              const typedItem = item as KanbanDocumentItem
              const doc = typedItem.document
              return (
                <KanbanCard
                  key={typedItem.id}
                  id={typedItem.id}
                  name={typedItem.name}
                  column={typedItem.column}
                  onClick={() => onToggleSelection(typedItem.id)}
                  data-selected={selectedIds.has(typedItem.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <DocumentPreviewHover document={doc}>
                        <CardTitle className="text-sm cursor-pointer hover:underline">
                          {typedItem.name}
                        </CardTitle>
                      </DocumentPreviewHover>
                      <DocumentActionsDropdown
                        documentId={doc.id}
                        documentTitle={doc.title}
                        size="icon-sm"
                      />
                    </div>
                    <CardDescription>
                      {formatFileSize(doc.version?.sizeBytes || 0)} • {new Date(doc.createdAt).toLocaleDateString()}
                    </CardDescription>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))}
                        {doc.tags.length > 2 && (
                          <Badge variant="outline">
                            +{doc.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </KanbanCard>
              )
            }}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  )
}
