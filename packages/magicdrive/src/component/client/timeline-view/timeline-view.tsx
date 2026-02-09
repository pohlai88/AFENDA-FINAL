/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Timeline view for documents - chronological document visualization
 * Inspired by Linear's timeline with grouped dates and visual connections
 */

"use client"

import { useState, useMemo } from "react"
import { cn } from "@afenda/shared/utils"
import { Card, CardContent } from "@afenda/shadcn"
import type { DocumentItem } from "@afenda/magicdrive/zustand"
import { formatFileSize, formatCompactDate } from "@afenda/magicdrive/constant"
import { Button } from "@afenda/shadcn"
import { ScrollArea } from "@afenda/shadcn"
import { Separator } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import {
  Calendar,
  Clock,
  CheckCircle,
  Archive,
  FileText,
  Image,
  Video,
  File,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

interface TimelineViewProps {
  documents: DocumentItem[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
}

function TimelineDocumentCard({
  document,
  isSelected,
  onToggleSelection,
  showConnector = true
}: {
  document: DocumentItem
  isSelected: boolean
  onToggleSelection: (id: string) => void
  showConnector?: boolean
}) {
  const renderDocumentIcon = (docType: string) => {
    const type = docType?.toLowerCase()
    if (['image', 'jpg', 'png', 'gif'].includes(type)) {
      // eslint-disable-next-line jsx-a11y/alt-text -- Lucide icon, not an actual image
      return <Image className="h-4 w-4 text-muted-foreground" />
    }
    if (['video', 'mp4', 'mov'].includes(type)) {
      return <Video className="h-4 w-4 text-muted-foreground" />
    }
    if (['pdf', 'doc', 'docx'].includes(type)) {
      return <FileText className="h-4 w-4 text-muted-foreground" />
    }
    return <File className="h-4 w-4 text-muted-foreground" />
  }

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "inbox":
        return <Clock className="h-3 w-3" />
      case "active":
        return <CheckCircle className="h-3 w-3" />
      case "archived":
        return <Archive className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "inbox":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
      case "active":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
      case "archived":
        return "text-muted-foreground bg-muted/50"
      default:
        return "text-muted-foreground bg-muted/50"
    }
  }

  const statusColor = getStatusColorClass(document.status || 'inbox')

  return (
    <div className="relative flex gap-3">
      {/* Timeline connector */}
      {showConnector && (
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center",
            statusColor
          )}>
            {renderStatusIcon(document.status || 'inbox')}
          </div>
          <div className="w-0.5 h-full bg-border mt-1" />
        </div>
      )}

      {/* Document card */}
      <Card
        className={cn(
          "flex-1 cursor-pointer hover:shadow-md transition-all duration-200",
          "hover:scale-[1.01] active:scale-[0.99]",
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={() => onToggleSelection(document.id)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Document type icon */}
            <div className="p-2 bg-muted rounded-sm">
              {renderDocumentIcon(document.docType)}
            </div>

            {/* Document content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium truncate" title={document.title || 'Untitled'}>
                    {document.title || 'Untitled'}
                  </h4>
                </div>

                <Badge variant="outline" className="text-xs shrink-0">
                  {document.status || 'inbox'}
                </Badge>
              </div>

              {/* Document metadata */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{formatFileSize(document.version?.sizeBytes || 0)}</span>
                <span>
                  {new Date(document.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {document.tags && document.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {document.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs px-1.5 py-0.5">
                        {tag.name}
                      </Badge>
                    ))}
                    {document.tags.length > 2 && (
                      <span className="text-muted-foreground">
                        +{document.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TimelineView({ documents, selectedIds, onToggleSelection }: TimelineViewProps) {
  // Group documents by date
  const timelineGroups = useMemo(() => {
    const groups = new Map<string, DocumentItem[]>()

    documents.forEach((document) => {
      const formattedDate = formatCompactDate(document.createdAt)

      if (!groups.has(formattedDate)) {
        groups.set(formattedDate, [])
      }
      groups.get(formattedDate)?.push(document)
    })

    // Sort documents within each group by time (newest first)
    groups.forEach((docs) => {
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })

    // Convert to array and sort by date (newest first)
    return Array.from(groups.entries())
      .map(([date, docs]) => ({ date, documents: docs, isExpanded: true }))
      .sort((a, b) => {
        // Get the most recent document in each group to sort groups
        const aTime = new Date(a.documents[0].createdAt).getTime()
        const bTime = new Date(b.documents[0].createdAt).getTime()
        return bTime - aTime
      })
  }, [documents])

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(timelineGroups.map(group => group.date))
  )

  const toggleGroupExpansion = (date: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(date)) {
        newSet.delete(date)
      } else {
        newSet.add(date)
      }
      return newSet
    })
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="space-y-4 p-4">
          {timelineGroups.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground">
                Documents will appear here in chronological order
              </p>
            </div>
          ) : (
            timelineGroups.map((group, groupIndex) => {
              const isExpanded = expandedGroups.has(group.date)
              const isLastGroup = groupIndex === timelineGroups.length - 1

              return (
                <div key={group.date} className="space-y-3">
                  {/* Group header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleGroupExpansion(group.date)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                      <h3 className="text-sm font-medium">{group.date}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {group.documents.length}
                      </Badge>
                    </div>

                    {group.documents.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(group.documents[0].createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Documents in this group */}
                  {isExpanded && (
                    <div className="space-y-3 ml-4">
                      {group.documents.map((document, docIndex) => (
                        <TimelineDocumentCard
                          key={document.id}
                          document={document}
                          isSelected={selectedIds.has(document.id)}
                          onToggleSelection={onToggleSelection}
                          showConnector={!isLastGroup || docIndex < group.documents.length - 1}
                        />
                      ))}
                    </div>
                  )}

                  {!isLastGroup && <Separator className="mt-4" />}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
