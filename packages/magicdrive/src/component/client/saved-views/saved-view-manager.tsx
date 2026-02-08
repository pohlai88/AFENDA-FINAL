/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Saved views management component with create, edit, delete functionality
 */

"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { routes } from "@afenda/shared/constants"
import { useSavedViewsStore } from "@afenda/magicdrive/zustand"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Label } from "@afenda/shadcn"
import { Textarea } from "@afenda/shadcn"
import { Switch } from "@afenda/shadcn"
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
} from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import {
  FolderOpen,
  Save,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Globe,
  Lock,
  Star,
  Plus,
  Search,
  Filter,
} from "lucide-react"
import type { 
  SavedView, 
  SmartFilter, 
  ViewMode, 
  SortBy, 
  SortOrder 
} from "@afenda/magicdrive/zod"

interface SavedViewManagerProps {
  currentFilters: SmartFilter
  currentViewMode: ViewMode
  currentSortBy: SortBy
  currentSortOrder: SortOrder
  onViewApply: (view: SavedView) => void
  className?: string
}

export function SavedViewManager({
  currentFilters,
  currentViewMode,
  currentSortBy,
  currentSortOrder,
  onViewApply,
  className,
}: SavedViewManagerProps) {
  // Use Zustand store for caching
  const { views: savedViews, setViews, addView, updateView, deleteView: removeView, shouldRefetch } = useSavedViewsStore()
  
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingView, setEditingView] = useState<SavedView | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
    isDefault: false,
  })

  // Fetch saved views only if cache is stale
  useEffect(() => {
    if (shouldRefetch()) {
      fetchSavedViews()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRefetch])

  const fetchSavedViews = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(routes.api.v1.magicdrive.savedViews(), {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch saved views")
      const data = await response.json()
      setViews(data.data?.items ?? [])
    } catch (error) {
      console.error("Error fetching saved views:", error)
      toast.error("Failed to load saved views")
    } finally {
      setLoading(false)
    }
  }, [setViews])

  const validateViewName = useCallback((name: string, excludeId?: string) => {
    const trimmed = name.trim()
    
    if (!trimmed) {
      return "Please enter a view name"
    }
    
    if (trimmed.length > 100) {
      return "View name must be less than 100 characters"
    }
    
    const isDuplicate = savedViews.some(view => 
      view.name.toLowerCase() === trimmed.toLowerCase() &&
      view.id !== excludeId
    )
    
    if (isDuplicate) {
      return "A view with this name already exists"
    }
    
    return null
  }, [savedViews])

  const handleCreateView = async () => {
    const error = validateViewName(formData.name)
    if (error) {
      toast.error(error)
      return
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const newView: SavedView = {
      id: tempId,
      tenantId: '',
      userId: '',
      name: formData.name.trim(),
      description: formData.description.trim(),
      filters: currentFilters,
      viewMode: currentViewMode,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder,
      isPublic: formData.isPublic,
      isDefault: formData.isDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    addView(newView)
    setIsCreateOpen(false)
    const previousFormData = { ...formData }
    setFormData({ name: "", description: "", isPublic: false, isDefault: false })
    setActionLoading('create')

    try {
      const response = await fetch(routes.api.v1.magicdrive.savedViews(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newView.name,
          description: newView.description,
          filters: currentFilters,
          viewMode: currentViewMode,
          sortBy: currentSortBy,
          sortOrder: currentSortOrder,
          isPublic: formData.isPublic,
          isDefault: formData.isDefault,
        }),
      })

      if (!response.ok) throw new Error("Failed to create view")
      
      const data = await response.json()
      // Replace temp with real data (envelope: data.data)
      const created = data.data ?? data.savedView
      removeView(tempId)
      addView(created)
      toast.success("View saved successfully")
    } catch (error) {
      console.error("Error creating view:", error)
      // Rollback on error
      removeView(tempId)
      setIsCreateOpen(true)
      setFormData(previousFormData)
      toast.error("Failed to save view")
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateView = async () => {
    if (!editingView) return
    
    const error = validateViewName(formData.name, editingView.id)
    if (error) {
      toast.error(error)
      return
    }

    // Optimistic update
    const previousView = { ...editingView }
    const updates = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      isPublic: formData.isPublic,
      isDefault: formData.isDefault,
      updatedAt: new Date().toISOString(),
    }
    
    updateView(editingView.id, updates)
    setIsEditOpen(false)
    setEditingView(null)
    setFormData({ name: "", description: "", isPublic: false, isDefault: false })
    setActionLoading(editingView.id)

    try {
      const response = await fetch(routes.api.v1.magicdrive.savedViewById(editingView.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update view")
      
      const data = await response.json()
      // Update with server response (envelope: data.data)
      const updated = data.data ?? data.savedView
      updateView(editingView.id, updated)
      toast.success("View updated successfully")
    } catch (error) {
      console.error("Error updating view:", error)
      // Rollback on error
      updateView(editingView.id, previousView)
      setIsEditOpen(true)
      setEditingView(previousView)
      setFormData({
        name: previousView.name,
        description: previousView.description || "",
        isPublic: previousView.isPublic,
        isDefault: previousView.isDefault,
      })
      toast.error("Failed to update view")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteView = async (viewId: string) => {
    // Optimistic update
    const deletedView = savedViews.find(v => v.id === viewId)
    if (!deletedView) return
    
    removeView(viewId)
    setActionLoading(viewId)

    try {
      const response = await fetch(routes.api.v1.magicdrive.savedViewById(viewId), {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to delete view")
      
      toast.success("View deleted successfully")
    } catch (error) {
      console.error("Error deleting view:", error)
      // Rollback on error
      addView(deletedView)
      toast.error("Failed to delete view")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicateView = async (view: SavedView) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const duplicatedView: SavedView = {
      ...view,
      id: tempId,
      name: `${view.name} (Copy)`,
      isPublic: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    addView(duplicatedView)
    setActionLoading('duplicate')

    try {
      const response = await fetch(routes.api.v1.magicdrive.savedViews(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: duplicatedView.name,
          description: view.description,
          filters: view.filters,
          viewMode: view.viewMode,
          sortBy: view.sortBy,
          sortOrder: view.sortOrder,
          isPublic: false,
          isDefault: false,
        }),
      })

      if (!response.ok) throw new Error("Failed to duplicate view")
      
      const data = await response.json()
      // Replace temp with real data (envelope: data.data)
      const duplicated = data.data ?? data.savedView
      removeView(tempId)
      addView(duplicated)
      toast.success("View duplicated successfully")
    } catch (error) {
      console.error("Error duplicating view:", error)
      // Rollback on error
      removeView(tempId)
      toast.error("Failed to duplicate view")
    } finally {
      setActionLoading(null)
    }
  }

  const openEditDialog = (view: SavedView) => {
    setEditingView(view)
    setFormData({
      name: view.name,
      description: view.description || "",
      isPublic: view.isPublic,
      isDefault: view.isDefault,
    })
    setIsEditOpen(true)
  }

  const filteredViews = useMemo(() => 
    savedViews.filter(view =>
      view.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      view.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [savedViews, searchQuery]
  )

  const getViewModeIcon = useCallback((mode: ViewMode) => {
    switch (mode) {
      case "cards": return <FolderOpen className="h-4 w-4" />
      case "table": return <Filter className="h-4 w-4" />
      case "board": return <FolderOpen className="h-4 w-4" />
      case "timeline": return <Search className="h-4 w-4" />
      case "relationship": return <Star className="h-4 w-4" />
      default: return <FolderOpen className="h-4 w-4" />
    }
  }, [])

  return (
    <ClientTooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Saved Views</CardTitle>
              <CardDescription>
                Save and manage your custom document views
              </CardDescription>
            </div>
            <ClientDialog 
              open={isCreateOpen} 
              onOpenChange={(open) => {
                setIsCreateOpen(open)
                if (!open) {
                  // Reset form when closing
                  setFormData({ name: "", description: "", isPublic: false, isDefault: false })
                }
              }}
            >
              <ClientDialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Save Current View
                </Button>
              </ClientDialogTrigger>
              <ClientDialogContent>
                <ClientDialogHeader>
                  <ClientDialogTitle>Save Current View</ClientDialogTitle>
                  <ClientDialogDescription>
                    Save the current filters and view settings for quick access
                  </ClientDialogDescription>
                </ClientDialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">View Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Recent Invoices"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of this view"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Make Public</Label>
                      <p className="text-sm text-muted-foreground">
                        Other users can see and use this view
                      </p>
                    </div>
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Set as Default</Label>
                      <p className="text-sm text-muted-foreground">
                        This will be your default view when opening magicdrive
                      </p>
                    </div>
                    <Switch
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                    />
                  </div>
                </div>
                <ClientDialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                    disabled={actionLoading === 'create'}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateView}
                    disabled={actionLoading === 'create'}
                  >
                    {actionLoading === 'create' ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save View
                      </>
                    )}
                  </Button>
                </ClientDialogFooter>
              </ClientDialogContent>
            </ClientDialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search saved views..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Views List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading saved views...
              </div>
            ) : filteredViews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No views found matching your search" : "No saved views yet"}
              </div>
            ) : (
              filteredViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getViewModeIcon(view.viewMode)}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{view.name}</span>
                          {view.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                          {view.isPublic ? (
                            <ClientTooltip>
                              <ClientTooltipTrigger>
                                <Globe className="h-3 w-3 text-muted-foreground" />
                              </ClientTooltipTrigger>
                              <ClientTooltipContent>Public view</ClientTooltipContent>
                            </ClientTooltip>
                          ) : (
                            <ClientTooltip>
                              <ClientTooltipTrigger>
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              </ClientTooltipTrigger>
                              <ClientTooltipContent>Private view</ClientTooltipContent>
                            </ClientTooltip>
                          )}
                        </div>
                        {view.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {view.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClientTooltip>
                      <ClientTooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewApply(view)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </ClientTooltipTrigger>
                      <ClientTooltipContent>Apply view</ClientTooltipContent>
                    </ClientTooltip>
                    <ClientDropdownMenu>
                      <ClientDropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </ClientDropdownMenuTrigger>
                      <ClientDropdownMenuContent align="end">
                        <ClientDropdownMenuItem onClick={() => openEditDialog(view)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </ClientDropdownMenuItem>
                        <ClientDropdownMenuItem 
                          onClick={() => handleDuplicateView(view)}
                          disabled={actionLoading === 'duplicate'}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {actionLoading === 'duplicate' ? 'Duplicating...' : 'Duplicate'}
                        </ClientDropdownMenuItem>
                        <ClientDropdownMenuSeparator />
                        <ClientDropdownMenuItem
                          onClick={() => handleDeleteView(view.id)}
                          className="text-destructive"
                          disabled={actionLoading === view.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {actionLoading === view.id ? 'Deleting...' : 'Delete'}
                        </ClientDropdownMenuItem>
                      </ClientDropdownMenuContent>
                    </ClientDropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ClientDialog 
        open={isEditOpen} 
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            // Reset form when closing
            setEditingView(null)
            setFormData({ name: "", description: "", isPublic: false, isDefault: false })
          }
        }}
      >
        <ClientDialogContent>
          <ClientDialogHeader>
            <ClientDialogTitle>Edit Saved View</ClientDialogTitle>
            <ClientDialogDescription>
              Update the details of your saved view
            </ClientDialogDescription>
          </ClientDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">View Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Other users can see and use this view
                </p>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Set as Default</Label>
                <p className="text-sm text-muted-foreground">
                  This will be your default view
                </p>
              </div>
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
              />
            </div>
          </div>
          <ClientDialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditOpen(false)}
              disabled={!!actionLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateView}
              disabled={!!actionLoading}
            >
              {actionLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update View
                </>
              )}
            </Button>
          </ClientDialogFooter>
        </ClientDialogContent>
      </ClientDialog>
    </ClientTooltipProvider>
  )
}
