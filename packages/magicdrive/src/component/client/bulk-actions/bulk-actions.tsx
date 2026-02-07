/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Bulk operations component for selected documents
 * Features: Archive, tag, process, share operations with mobile support
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { routes } from "@afenda/shared/constants"
import { cn } from "@afenda/shared/utils"
import { toast } from "sonner"
import { Button } from "@afenda/shadcn"
import { Card, CardContent } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@afenda/shadcn"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Label } from "@afenda/shadcn"
import { Textarea } from "@afenda/shadcn"
import { useShallow } from "zustand/react/shallow"
import { useDocumentHubStore } from "@afenda/magicdrive/zustand"
import {
  Archive,
  Tag,
  Share2,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  MoreVertical,
  Clock,
} from "lucide-react"

interface BulkActionsProps {
  className?: string
  compact?: boolean
}

export function BulkActions({ className, compact = false }: BulkActionsProps) {
  const { selectedIds, documents, clearSelection, isMobile } =
    useDocumentHubStore(
      useShallow((s) => ({
        selectedIds: s.selectedIds,
        documents: s.documents,
        clearSelection: s.clearSelection,
        isMobile: s.isMobile,
      }))
    )

  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [existingTags, setExistingTags] = useState<Array<{ id: string; name: string }>>([])
  const [shareEmail, setShareEmail] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const selectedCount = selectedIds.size
  const selectedDocuments = documents.filter(doc => selectedIds.has(doc.id))

  // Fetch existing tags when dialog opens
  useEffect(() => {
    if (!isTagDialogOpen) return

    const fetchTags = async () => {
      try {
        const res = await fetch(routes.api.v1.magicdrive.tags(), {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (data.data?.items) {
            setExistingTags(data.data.items)
          }
        }
      } catch {
        // Silently fail - user can still create new tags
      }
    }

    void fetchTags()
  }, [isTagDialogOpen])

  // Handle bulk archive
  const handleBulkArchive = useCallback(async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(routes.api.v1.magicdrive.bulk(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'archive',
          objectIds: Array.from(selectedIds),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Failed to archive documents')
      }

      const data = await res.json()
      toast.success(`Archived ${data.data.updated} document(s)`)
      clearSelection()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive documents'
      toast.error(message)
      console.error('Failed to archive documents:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedIds, clearSelection])

  // Handle bulk tagging
  const handleBulkTag = useCallback(async () => {
    if (!newTagName.trim() && !selectedTagId) return

    setIsProcessing(true)
    try {
      let tagId = selectedTagId
      let tagName = newTagName.trim()

      // If using existing tag, find its name for the success message
      if (selectedTagId) {
        const existingTag = existingTags.find(t => t.id === selectedTagId)
        tagName = existingTag?.name || 'selected tag'
      } else {
        // Create the tag if entering a new name
        const createTagRes = await fetch(routes.api.v1.magicdrive.tags(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: tagName }),
        })

        if (!createTagRes.ok) {
          const err = await createTagRes.json()
          throw new Error(err.error?.message || 'Failed to create tag')
        }

        const tagData = await createTagRes.json()
        tagId = tagData.data.tag.id
      }

      // Apply the tag to all selected documents
      const bulkRes = await fetch(routes.api.v1.magicdrive.bulk(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'addTag',
          objectIds: Array.from(selectedIds),
          tagId,
        }),
      })

      if (!bulkRes.ok) {
        const err = await bulkRes.json()
        throw new Error(err.error?.message || 'Failed to tag documents')
      }

      const data = await bulkRes.json()
      toast.success(`Tagged ${data.data.updated} document(s) with "${tagName}"`)
      setIsTagDialogOpen(false)
      setNewTagName('')
      setSelectedTagId(null)
      clearSelection()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to tag documents'
      toast.error(message)
      console.error('Failed to tag documents:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedIds, newTagName, selectedTagId, existingTags, clearSelection])

  // Handle bulk processing (move to active status)
  const handleBulkProcess = useCallback(async () => {
    setIsProcessing(true)
    try {
      // Process each document by updating its status to 'active'
      const objectIds = Array.from(selectedIds)
      let processed = 0

      for (const objectId of objectIds) {
        const res = await fetch(routes.api.v1.magicdrive.objectById(objectId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'active' }),
        })

        if (res.ok) processed++
      }

      toast.success(`Processed ${processed} document(s)`)
      clearSelection()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process documents'
      toast.error(message)
      console.error('Failed to process documents:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedIds, clearSelection])

  // Handle bulk download
  const handleBulkDownload = useCallback(async () => {
    setIsProcessing(true)
    try {
      const objectIds = Array.from(selectedIds)
      let downloaded = 0

      // Download each file individually (open in new tabs)
      for (const objectId of objectIds) {
        const res = await fetch(routes.api.v1.magicdrive.objectSourceUrl(objectId), {
          credentials: 'include',
        })

        if (res.ok) {
          const data = await res.json()
          if (data.data?.url) {
            window.open(data.data.url, '_blank')
            downloaded++
          }
        }
      }

      toast.success(`Downloaded ${downloaded} document(s)`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download documents'
      toast.error(message)
      console.error('Failed to download documents:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedIds])

  // Handle bulk share (placeholder - sharing API not yet implemented)
  const handleBulkShare = useCallback(async () => {
    if (!shareEmail.trim()) return

    setIsProcessing(true)
    try {
      // Note: Share API is not yet implemented on the backend
      // For now, we'll show a placeholder message
      toast.info('Sharing feature coming soon')
      setIsShareDialogOpen(false)
      setShareEmail('')
      setShareMessage('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share documents'
      toast.error(message)
      console.error('Failed to share documents:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [shareEmail])

  // Handle bulk delete (soft delete via bulk API)
  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} documents?`)) return

    setIsProcessing(true)
    try {
      const res = await fetch(routes.api.v1.magicdrive.bulk(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete',
          objectIds: Array.from(selectedIds),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Failed to delete documents')
      }

      const data = await res.json()
      toast.success(`Deleted ${data.data.updated} document(s)`)
      clearSelection()
    } catch (error) {
      console.error('Failed to delete documents:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedCount, selectedIds, clearSelection])

  if (selectedCount === 0) {
    return null
  }

  if (compact && isMobile) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary">{selectedCount} selected</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleBulkProcess} disabled={isProcessing}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Process
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsTagDialogOpen(true)}>
              <Tag className="mr-2 h-4 w-4" />
              Add Tag
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBulkArchive} disabled={isProcessing}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBulkDownload} disabled={isProcessing}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBulkDelete} disabled={isProcessing} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selection summary */}
      <Card className="border-primary">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear selection
              </Button>
            </div>

            {/* Document types summary */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                selectedDocuments.reduce((acc, doc) => {
                  acc[doc.docType] = (acc[doc.docType] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk action buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {/* Primary actions */}
              <Button
                onClick={handleBulkProcess}
                disabled={isProcessing}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Process
                {isProcessing && <Clock className="h-4 w-4 animate-spin" />}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsTagDialogOpen(true)}
                disabled={isProcessing}
                className="gap-2"
              >
                <Tag className="h-4 w-4" />
                Add Tag
              </Button>

              {/* Secondary actions - desktop */}
              <div className="hidden sm:flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBulkArchive}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>

                <Button
                  variant="outline"
                  onClick={handleBulkDownload}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsShareDialogOpen(true)}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Mobile overflow menu */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      More Actions
                      <MoreVertical className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBulkArchive} disabled={isProcessing}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkDownload} disabled={isProcessing}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBulkDelete} disabled={isProcessing} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Danger zone */}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tag Dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing tags selector */}
            {existingTags.length > 0 && (
              <div className="space-y-2">
                <Label>Select Existing Tag</Label>
                <div className="flex flex-wrap gap-2">
                  {existingTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTagId === tag.id ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedTagId(selectedTagId === tag.id ? null : tag.id)
                        setNewTagName('')
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Or create new tag */}
            <div className="space-y-2">
              <Label htmlFor="tag-name">
                {existingTags.length > 0 ? 'Or Create New Tag' : 'Tag Name'}
              </Label>
              <Input
                id="tag-name"
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value)
                  setSelectedTagId(null)
                }}
                maxLength={50}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              This tag will be applied to all {selectedCount} selected documents
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkTag}
                disabled={(!newTagName.trim() && !selectedTagId) || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Adding Tag...
                  </>
                ) : (
                  <>
                    <Tag className="mr-2 h-4 w-4" />
                    Add Tag
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-email">Email Address</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-message">Message (Optional)</Label>
              <Textarea
                id="share-message"
                placeholder="Add a message for the recipient"
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Share2 className="h-4 w-4" />
              Sharing {selectedCount} document{selectedCount !== 1 ? 's' : ''}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkShare} disabled={!shareEmail.trim() || isProcessing}>
                {isProcessing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
