"use client"

/**
 * Saved Filter Presets for DataTable
 * Save and load filter configurations with user preferences
 */

import * as React from "react"
import { IconBookmark, IconBookmarkFilled, IconTrash, IconPlus } from "@tabler/icons-react"
import { type ColumnFiltersState } from "@tanstack/react-table"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import { Input } from "./input"
import { Label } from "./label"

export interface FilterPreset {
  id: string
  name: string
  filters: ColumnFiltersState
  createdAt: Date
}

export interface FilterPresetsProps {
  tableId: string
  currentFilters: ColumnFiltersState
  onApplyPreset: (filters: ColumnFiltersState) => void
  storageKey?: string
}

/**
 * Hook for managing filter presets with localStorage
 */
export function useFilterPresets(tableId: string, storageKey = "table-filter-presets") {
  const key = `${storageKey}-${tableId}`
  
  const [presets, setPresets] = React.useState<FilterPreset[]>(() => {
    if (typeof window === "undefined") return []
    
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Save presets to localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      localStorage.setItem(key, JSON.stringify(presets))
    } catch (error) {
      console.error("Failed to save filter presets:", error)
    }
  }, [presets, key])

  const savePreset = React.useCallback((name: string, filters: ColumnFiltersState) => {
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters,
      createdAt: new Date(),
    }
    
    setPresets((prev) => [...prev, newPreset])
    return newPreset
  }, [])

  const deletePreset = React.useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const updatePreset = React.useCallback((id: string, filters: ColumnFiltersState) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, filters } : p))
    )
  }, [])

  return {
    presets,
    savePreset,
    deletePreset,
    updatePreset,
  }
}

/**
 * Filter Presets Component
 */
export function FilterPresets({
  tableId,
  currentFilters,
  onApplyPreset,
  storageKey,
}: FilterPresetsProps) {
  const { presets, savePreset, deletePreset } = useFilterPresets(tableId, storageKey)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [presetName, setPresetName] = React.useState("")

  const hasActiveFilters = currentFilters.length > 0

  const handleSavePreset = React.useCallback(() => {
    if (!presetName.trim()) return
    
    savePreset(presetName.trim(), currentFilters)
    setPresetName("")
    setIsDialogOpen(false)
  }, [presetName, currentFilters, savePreset])

  const handleApplyPreset = React.useCallback((preset: FilterPreset) => {
    onApplyPreset(preset.filters)
  }, [onApplyPreset])

  return (
    <div className="flex items-center gap-2">
      {/* Saved Presets Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={presets.length === 0}
          >
            <IconBookmark className="mr-2 size-4" />
            Saved Filters ({presets.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px]">
          <DropdownMenuLabel>Saved Filter Presets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {presets.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No saved presets yet
            </div>
          ) : (
            presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                className="flex items-center justify-between"
                onSelect={() => handleApplyPreset(preset)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {preset.filters.length} filter{preset.filters.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePreset(preset.id)
                  }}
                  aria-label="Delete preset"
                >
                  <IconTrash className="size-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Current Filters */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!hasActiveFilters}
          >
            <IconBookmarkFilled className="mr-2 size-4" />
            Save Filters
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Save your current filters as a preset for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., High Priority Items"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSavePreset()
                  }
                }}
              />
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium mb-2">Current Filters:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {currentFilters.map((filter, index) => (
                  <li key={index}>
                    • {String(filter.id)}: {String(filter.value)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
            >
              <IconPlus className="mr-2 size-4" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
