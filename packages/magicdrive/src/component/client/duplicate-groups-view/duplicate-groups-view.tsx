/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Duplicate groups view: list groups, show documents in selected group
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { routes } from "@afenda/shared/constants"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import { ScrollArea } from "@afenda/shadcn"
import { Copy, ChevronRight, FileText, Inbox } from "lucide-react"
import { EnhancedDocumentCard } from "../document-card/enhanced-document-card"

type DuplicateGroup = {
  id: string
  tenantId: string
  reason: string
  keepVersionId: string | null
  createdAt: string
  versions: {
    versionId: string
    objectId: string
    title: string | null
    mimeType: string
    sizeBytes: number
    sha256: string
    versionCreatedAt: string
  }[]
}

type DocumentItem = {
  id: string
  title: string | null
  docType: string
  status: string
  createdAt: string
  updatedAt?: string
  tags?: { id: string; name: string; slug: string }[]
  version?: { id: string; mimeType: string; sizeBytes: number; sha256: string; createdAt: string }
}

export function DuplicateGroupsView() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupDocs, setGroupDocs] = useState<DocumentItem[]>([])
  const [docsLoading, setDocsLoading] = useState(false)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${routes.api.v1.magicdrive.duplicateGroups()}?limit=50&offset=0`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error("Failed to load duplicate groups")
      const data = await res.json()
      setGroups(data.data?.items ?? [])
      setTotal(data.data?.total ?? 0)
      if (data.data?.items?.length && !selectedGroupId) {
        setSelectedGroupId(data.data.items[0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [selectedGroupId])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const fetchDocumentsForGroup = useCallback(async (groupId: string) => {
    setDocsLoading(true)
    try {
      const res = await fetch(
        `${routes.api.v1.magicdrive.list()}?limit=50&offset=0&dupGroup=${groupId}`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error("Failed to load documents")
      const data = await res.json()
      setGroupDocs(data.data?.items ?? [])
    } catch {
      setGroupDocs([])
    } finally {
      setDocsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedGroupId) fetchDocumentsForGroup(selectedGroupId)
    else setGroupDocs([])
  }, [selectedGroupId, fetchDocumentsForGroup])

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
          <Button variant="outline" className="mt-4" onClick={fetchGroups}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No duplicate groups found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Duplicates are detected when the same file (SHA-256) is uploaded more than once.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate groups
          </CardTitle>
          <CardDescription>
            {total} group{total !== 1 ? "s" : ""} with potential duplicates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {groups.map((g) => (
                <Button
                  key={g.id}
                  variant={selectedGroupId === g.id ? "secondary" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedGroupId(g.id)}
                >
                  <span className="truncate text-left flex-1">
                    {g.versions[0]?.title ?? "Untitled"} (+{g.versions.length - 1})
                  </span>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {g.versions.length}
                  </Badge>
                  <ChevronRight className="h-4 w-4 shrink-0 ml-1" />
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents in this group
          </CardTitle>
          <CardDescription>
            {selectedGroup
              ? `${selectedGroup.versions.length} version(s) — same content (SHA-256 match)`
              : "Select a group"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : groupDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No documents</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {groupDocs.map((doc) => (
                <EnhancedDocumentCard
                  key={doc.id}
                  document={doc}
                  viewMode="card"
                  isSelected={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
