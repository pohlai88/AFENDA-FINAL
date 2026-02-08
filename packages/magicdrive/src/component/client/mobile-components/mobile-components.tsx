/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Mobile-specific components for magicdrive
 * Features: Touch gestures, bottom sheets, mobile-optimized layouts
 */

"use client"

import { cn } from "@afenda/shared/utils"
import { Button } from "@afenda/shadcn"
import { Card, CardContent } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { ClientSheet, ClientSheetContent, ClientSheetHeader, ClientSheetTitle } from "@afenda/shadcn"
import { useDocumentHubStore } from "@afenda/magicdrive/zustand"
import {
  Upload,
  Filter,
  Search,
  X,
  Archive,
  Tag,
  Share2,
  Download,
  List,
  Grid3X3,
} from "lucide-react"

interface MobileActionBarProps {
  className?: string
}

export function MobileActionBar({ className }: MobileActionBarProps) {
  const {
    selectedIds,
    clearSelection,
    viewMode,
    setViewMode,
    showFilters,
    toggleFilters,
    isMobile,
  } = useDocumentHubStore()

  const selectedCount = selectedIds.size

  if (!isMobile) return null

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-2",
      className
    )}>
      <div className="flex items-center justify-between">
        {/* Left side - Selection info */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <>
              <Badge variant="secondary">{selectedCount}</Badge>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </>
          )}
        </div>

        {/* Center - View mode toggle */}
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-8 w-8 p-0"
            title="Card view"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={toggleFilters}
            className="gap-1"
          >
            <Filter className="h-4 w-4" />
            {showFilters && <X className="h-4 w-4" />}
          </Button>
          <Button size="sm" className="gap-1">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface MobileQuickActionsProps {
  className?: string
}

export function MobileQuickActions({ className }: MobileQuickActionsProps) {
  const { selectedIds, clearSelection, isMobile } = useDocumentHubStore()

  const selectedCount = selectedIds.size

  if (!isMobile || selectedCount === 0) return null

  return (
    <div className={cn("fixed bottom-20 left-4 right-4 z-40", className)}>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{selectedCount} selected</span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="h-12 w-12 p-0">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-12 w-12 p-0">
              <Tag className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-12 w-12 p-0">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-12 w-12 p-0">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface MobileFilterSheetProps {
  _className?: string
  children: React.ReactNode
}

export function MobileFilterSheet({ _className, children }: MobileFilterSheetProps) {
  const { isMobile, showFilters, toggleFilters } = useDocumentHubStore()

  if (!isMobile) return null

  return (
    <ClientSheet open={showFilters} onOpenChange={toggleFilters}>
      <ClientSheetContent side="bottom" className="h-[80vh]">
        <ClientSheetHeader>
          <ClientSheetTitle>Filters</ClientSheetTitle>
        </ClientSheetHeader>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </ClientSheetContent>
    </ClientSheet>
  )
}

interface MobileSearchBarProps {
  className?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export function MobileSearchBar({ className, placeholder = "Search documents...", value, onChange }: MobileSearchBarProps) {
  const { isMobile } = useDocumentHubStore()

  if (!isMobile) return null

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-10 pr-4 h-10 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}

interface MobileUploadButtonProps {
  className?: string
  onClick?: () => void
}

export function MobileUploadButton({ className, onClick }: MobileUploadButtonProps) {
  const { isMobile } = useDocumentHubStore()

  if (!isMobile) return null

  return (
    <Button
      size="lg"
      className={cn(
        "fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full shadow-lg",
        className
      )}
      onClick={onClick}
    >
      <Upload className="h-6 w-6" />
    </Button>
  )
}

interface MobileStatsCardProps {
  className?: string
  title: string
  value: number
  icon: React.ReactNode
  color: string
}

export function MobileStatsCard({ className, title, value, icon, color }: MobileStatsCardProps) {
  const { isMobile } = useDocumentHubStore()

  if (!isMobile) return null

  return (
    <Card className={cn("bg-card", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", color)}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
