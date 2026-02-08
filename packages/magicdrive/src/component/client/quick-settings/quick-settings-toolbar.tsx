/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Quick settings toolbar for frequently used magicdrive options
 */

"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Button,
} from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  ClientDropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Separator } from "@afenda/shadcn"
import {
  Grid3X3,
  Table,
  Calendar,
  Kanban,
  GitBranch,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image,
  FileText,
  Minimize2,
  Maximize2,
  Save,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react"
import type {
  UserPreferences,
  ViewMode,
  SortBy,
  SortOrder
} from "@afenda/magicdrive/zod"
import { routes } from "@afenda/shared/constants"
import { useDocumentHubStore } from "@afenda/magicdrive/zustand"

interface QuickSettingsToolbarProps {
  className?: string
}

export function QuickSettingsToolbar({ className }: QuickSettingsToolbarProps) {
  const {
    viewMode,
    sortBy: _sortBy,
    sortOrder,
    setViewMode,
    setSorting,
  } = useDocumentHubStore()

  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch user preferences on mount
  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch(routes.api.v1.magicdrive.preferences(), {
        credentials: "include",
      })
      if (!response.ok) return
      const data = await response.json()
      setPreferences(data.data?.preferences ?? null)
    } catch (error) {
      console.error("Failed to fetch preferences:", error)
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    setIsLoading(true)
    try {
      const response = await fetch(routes.api.v1.magicdrive.preferences(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update preferences")

      const data = await response.json()
      setPreferences(data.data?.preferences ?? null)
      toast.success("Settings updated")
    } catch (error) {
      console.error("Error updating preferences:", error)
      toast.error("Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    updatePreferences({ defaultView: mode })
  }

  const handleSortChange = (by: SortBy, order: SortOrder) => {
    setSorting(by, order)
    updatePreferences({ defaultSort: `${by}-${order}` })
  }

  const toggleFileExtensions = () => {
    if (!preferences) return
    updatePreferences({ showFileExtensions: !preferences.showFileExtensions })
  }

  const toggleThumbnails = () => {
    if (!preferences) return
    updatePreferences({ showThumbnails: !preferences.showThumbnails })
  }

  const toggleCompactMode = () => {
    if (!preferences) return
    updatePreferences({ compactMode: !preferences.compactMode })
  }

  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case "cards": return <Grid3X3 className="h-4 w-4" />
      case "table": return <Table className="h-4 w-4" />
      case "board": return <Kanban className="h-4 w-4" />
      case "timeline": return <Calendar className="h-4 w-4" />
      case "list": return <List className="h-4 w-4" />
      case "relationship": return <GitBranch className="h-4 w-4" />
      default: return <Grid3X3 className="h-4 w-4" />
    }
  }

  const getSortIcon = (order: SortOrder) => {
    return order === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  return (
    <ClientTooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* View Mode Selector */}
        <ClientDropdownMenu>
          <ClientDropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isLoading}
            >
              {getViewModeIcon(viewMode)}
              <span className="hidden sm:inline capitalize">{viewMode}</span>
            </Button>
          </ClientDropdownMenuTrigger>
          <ClientDropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>View Mode</DropdownMenuLabel>
            <ClientDropdownMenuSeparator />
            <DropdownMenuRadioGroup value={viewMode} onValueChange={(value) => handleViewModeChange(value as ViewMode)}>
              <DropdownMenuRadioItem value="cards">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Cards
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="table">
                <Table className="h-4 w-4 mr-2" />
                Table
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="board">
                <Kanban className="h-4 w-4 mr-2" />
                Board
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="timeline">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="relationship">
                <GitBranch className="h-4 w-4 mr-2" />
                Relationship
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>

        {/* Sort Controls */}
        <ClientDropdownMenu>
          <ClientDropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isLoading}
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Sort</span>
              {getSortIcon(sortOrder)}
            </Button>
          </ClientDropdownMenuTrigger>
          <ClientDropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <ClientDropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>Date Created</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <ClientDropdownMenuItem onClick={() => handleSortChange("createdAt", "desc")}>
                  <ArrowDown className="h-3 w-3 mr-2" />
                  Newest First
                </ClientDropdownMenuItem>
                <ClientDropdownMenuItem onClick={() => handleSortChange("createdAt", "asc")}>
                  <ArrowUp className="h-3 w-3 mr-2" />
                  Oldest First
                </ClientDropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>Title</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <ClientDropdownMenuItem onClick={() => handleSortChange("title", "asc")}>
                  <ArrowUp className="h-3 w-3 mr-2" />
                  A to Z
                </ClientDropdownMenuItem>
                <ClientDropdownMenuItem onClick={() => handleSortChange("title", "desc")}>
                  <ArrowDown className="h-3 w-3 mr-2" />
                  Z to A
                </ClientDropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <ClientDropdownMenuItem onClick={() => handleSortChange("sizeBytes", "desc")}>
              <ArrowDown className="h-3 w-3 mr-2" />
              Largest First
            </ClientDropdownMenuItem>
            <ClientDropdownMenuItem onClick={() => handleSortChange("sizeBytes", "asc")}>
              <ArrowUp className="h-3 w-3 mr-2" />
              Smallest First
            </ClientDropdownMenuItem>
            <ClientDropdownMenuItem onClick={() => handleSortChange("updatedAt", "desc")}>
              <ArrowDown className="h-3 w-3 mr-2" />
              Recently Modified
            </ClientDropdownMenuItem>
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Quick Toggles */}
        <ClientTooltip>
          <ClientTooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFileExtensions}
              disabled={isLoading || !preferences}
              className={preferences?.showFileExtensions ? "bg-muted" : ""}
            >
              <FileText className="h-4 w-4" />
              <span className="sr-only">Toggle file extensions</span>
            </Button>
          </ClientTooltipTrigger>
          <ClientTooltipContent>
            <p>File Extensions {preferences?.showFileExtensions ? "On" : "Off"}</p>
          </ClientTooltipContent>
        </ClientTooltip>

        <ClientTooltip>
          <ClientTooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleThumbnails}
              disabled={isLoading || !preferences}
              className={preferences?.showThumbnails ? "bg-muted" : ""}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-4 w-4" />
              <span className="sr-only">Toggle thumbnails</span>
            </Button>
          </ClientTooltipTrigger>
          <ClientTooltipContent>
            <p>Thumbnails {preferences?.showThumbnails ? "On" : "Off"}</p>
          </ClientTooltipContent>
        </ClientTooltip>

        <ClientTooltip>
          <ClientTooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCompactMode}
              disabled={isLoading || !preferences}
              className={preferences?.compactMode ? "bg-muted" : ""}
            >
              {preferences?.compactMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="sr-only">Toggle compact mode</span>
            </Button>
          </ClientTooltipTrigger>
          <ClientTooltipContent>
            <p>Compact Mode {preferences?.compactMode ? "On" : "Off"}</p>
          </ClientTooltipContent>
        </ClientTooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Settings Menu */}
        <ClientDropdownMenu>
          <ClientDropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">More settings</span>
            </Button>
          </ClientDropdownMenuTrigger>
          <ClientDropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Display Options</DropdownMenuLabel>
            <ClientDropdownMenuSeparator />
            <ClientDropdownMenuItem onClick={toggleFileExtensions}>
              <FileText className="h-4 w-4 mr-2" />
              Show File Extensions
              <Badge variant="secondary" className="ml-auto">
                {preferences?.showFileExtensions ? "On" : "Off"}
              </Badge>
            </ClientDropdownMenuItem>
            <ClientDropdownMenuItem onClick={toggleThumbnails}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-4 w-4 mr-2" />
              Show Thumbnails
              <Badge variant="secondary" className="ml-auto">
                {preferences?.showThumbnails ? "On" : "Off"}
              </Badge>
            </ClientDropdownMenuItem>
            <ClientDropdownMenuItem onClick={toggleCompactMode}>
              <Minimize2 className="h-4 w-4 mr-2" />
              Compact Mode
              <Badge variant="secondary" className="ml-auto">
                {preferences?.compactMode ? "On" : "Off"}
              </Badge>
            </ClientDropdownMenuItem>
            <ClientDropdownMenuSeparator />
            <ClientDropdownMenuItem>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </ClientDropdownMenuItem>
            <ClientDropdownMenuItem>
              <Save className="h-4 w-4 mr-2" />
              Save Current View
            </ClientDropdownMenuItem>
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>
      </div>
    </ClientTooltipProvider>
  )
}
