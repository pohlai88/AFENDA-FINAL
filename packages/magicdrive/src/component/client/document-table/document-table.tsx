/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Table view for documents using shadcn Table components
 * Features: sortable columns, bulk selection, responsive design
 */

"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { cn } from "@afenda/shared/utils"
import { Badge } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Card } from "@afenda/shadcn"
import { Checkbox } from "@afenda/shadcn"
import { DocumentActionsDropdown } from "../ui/document-actions-dropdown"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@afenda/shadcn"
import {
  FileText,
  Clock,
  CheckCircle,
  Archive,
  XCircle,
  ArrowUpDown,
} from "lucide-react"
import { STATUS } from "@afenda/shared/constants"
import { routes } from "@afenda/shared/constants"

// Status configuration aligned with backend (lib/constants/magicdrive STATUS)
const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; label: string }
> = {
  [STATUS.INBOX]: {
    icon: Clock,
    color: "bg-primary/10 text-primary border-primary/30",
    label: "Inbox",
  },
  [STATUS.ACTIVE]: {
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    label: "Active",
  },
  [STATUS.ARCHIVED]: {
    icon: Archive,
    color: "bg-muted text-muted-foreground border-border",
    label: "Archived",
  },
  [STATUS.DELETED]: {
    icon: XCircle,
    color: "bg-destructive/10 text-destructive border-destructive/30",
    label: "Deleted",
  },
}
const DEFAULT_STATUS = {
  icon: Clock,
  color: "bg-primary/10 text-primary border-primary/30",
  label: "Inbox",
}

const getStatusIcon = (status: string) => {
  const config = STATUS_CONFIG[status] ?? DEFAULT_STATUS
  return <config.icon className="h-3 w-3 mr-1" />
}

const getStatusColor = (status: string) => {
  const config = STATUS_CONFIG[status] ?? DEFAULT_STATUS
  return config.color
}

const getStatusText = (status: string) => {
  const config = STATUS_CONFIG[status] ?? DEFAULT_STATUS
  return config.label
}

export interface DocumentTableProps {
  documents: Array<{
    id: string
    title: string | null
    docType: string
    status: string
    createdAt: string
    tags?: { id: string; name: string; slug: string }[]
    version?: {
      id: string
      mimeType: string
      sizeBytes: number
      sha256: string
    }
    preview?: {
      thumbnail?: string
      extracted?: string
    }
    aiClassifications?: {
      confidence: number
      suggestedTags: string[]
      duplicateGroupId?: string
    }
  }>
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  className?: string
}

export function DocumentTable({
  documents,
  selectedIds,
  onToggleSelection,
  className: _className,
}: DocumentTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const handleSort = useCallback((key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current?.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  // Sort documents based on current sort configuration
  // Use separate memoization deps to prevent unnecessary re-sorts
  const sortedDocuments = useMemo(() => {
    if (!sortConfig) return documents

    return [...documents].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a]
      const bValue = b[sortConfig.key as keyof typeof b]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [documents, sortConfig?.key, sortConfig?.direction]) // Depend on primitives, not object

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === documents.length && documents.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      documents.forEach(doc => onToggleSelection(doc.id))
                    } else {
                      selectedIds.forEach(id => onToggleSelection(id))
                    }
                  }}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('title')}
                >
                  Title
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('status')}
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('docType')}
                >
                  Type
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('size')}
                >
                  Size
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDocuments.map((document) => (
              <TableRow
                key={document.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  selectedIds.has(document.id) && "bg-muted"
                )}
                onClick={() => onToggleSelection(document.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(document.id)}
                    onCheckedChange={() => onToggleSelection(document.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Link
                        href={routes.ui.magicdrive.documentById(document.id)}
                        className="font-medium hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {document.title || 'Untitled Document'}
                      </Link>
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {document.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {document.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{document.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", getStatusColor(document.status))}>
                    {getStatusIcon(document.status)}
                    {getStatusText(document.status)}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{document.docType}</TableCell>
                <TableCell>
                  {document.version ? formatFileSize(document.version.sizeBytes) : '-'}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(document.createdAt)}
                    <div className="text-xs text-muted-foreground">
                      {formatTime(document.createdAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DocumentActionsDropdown
                    documentId={document.id}
                    documentTitle={document.title}
                    size="sm"
                    actions={['view', 'download', 'share', 'tag', 'archive', 'delete']}
                    onActionComplete={(action) => {
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
