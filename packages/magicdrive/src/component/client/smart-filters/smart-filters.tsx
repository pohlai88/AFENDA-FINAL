/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Intelligent filtering system with mobile-first design
 * Features: AI-powered suggestions, quick filters, advanced search, mobile-optimized
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { cn } from "@afenda/shared/utils"
import { Button } from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Calendar } from "@afenda/shadcn"
import { ClientPopover, ClientPopoverContent, ClientPopoverTrigger } from "@afenda/shadcn"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@afenda/shadcn"
import { routes } from "@afenda/shared/constants"
import { useDocumentHubStore } from "@afenda/magicdrive/zustand"
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  Tag,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Archive,
  Star,
  Pin,
  Users,
  Share2,
} from "lucide-react"
import { format } from "date-fns"

// Filter options
const STATUS_OPTIONS = [
  { value: 'inbox', label: 'Inbox', icon: Clock, color: 'bg-blue-100 text-blue-800' },
  { value: 'active', label: 'Active', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'archived', label: 'Archived', icon: Archive, color: 'bg-gray-100 text-gray-800' },
  { value: 'deleted', label: 'Deleted', icon: XCircle, color: 'bg-red-100 text-red-800' },
  { value: 'all', label: 'All Documents', icon: FileText, color: 'bg-gray-100 text-gray-800' },
] as const

const QUICK_ACCESS_OPTIONS = [
  { value: 'starred', label: 'Starred', icon: Star, color: 'text-yellow-500' },
  { value: 'pinned', label: 'Pinned', icon: Pin, color: 'text-blue-500' },
  { value: 'sharedWithMe', label: 'Shared with me', icon: Users, color: 'text-purple-500' },
  { value: 'sharedByMe', label: 'Shared by me', icon: Share2, color: 'text-green-500' },
] as const

const TYPE_OPTIONS = [
  { value: 'invoice', label: 'Invoices' },
  { value: 'contract', label: 'Contracts' },
  { value: 'receipt', label: 'Receipts' },
  { value: 'other', label: 'Other' },
  { value: 'all', label: 'All Types' },
] as const

interface SmartFiltersProps {
  className?: string
  compact?: boolean
}

export function SmartFilters({ className, compact = false }: SmartFiltersProps) {
  const {
    filters,
    setFilters,
    clearFilters,
    isMobile,
    toggleFilters
  } = useDocumentHubStore()

  const [tags, setTags] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '')

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(routes.api.v1.magicdrive.tags(), {
          credentials: 'include',
        })

        if (!response.ok) {
          console.error('Failed to fetch tags:', response.status, response.statusText)
          // Silently fail - tags are optional for filtering
          return
        }

        const data = await response.json()
        if (data.data?.items) {
          setTags(data.data.items)
        }
      } catch (err) {
        console.error('Error fetching tags:', err)
        // Silently fail - tags are optional for filtering
      }
    }

    void fetchTags()
  }, []) // Only run once on mount

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setFilters({ searchQuery: query || undefined })
  }, [setFilters])

  // Handle status filter
  const handleStatusChange = useCallback((status: typeof STATUS_OPTIONS[number]['value']) => {
    setFilters({
      status: status === 'all' ? undefined : status
    })
  }, [setFilters])

  // Handle type filter
  const handleTypeChange = useCallback((type: typeof TYPE_OPTIONS[number]['value']) => {
    setFilters({
      type: type === 'all' ? undefined : type
    })
  }, [setFilters])

  // Handle date range
  const handleDateRangeChange = useCallback((range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({ from: range.from, to: range.to })
      setFilters({ dateRange: { from: range.from.toISOString(), to: range.to.toISOString() } })
    } else {
      setDateRange(undefined)
      setFilters({ dateRange: undefined })
    }
  }, [setFilters])

  // Handle tag selection
  const handleTagToggle = useCallback((tagId: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId]

    setFilters({ tags: newTags.length > 0 ? newTags : undefined })
  }, [filters.tags, setFilters])

  // Handle quick access filters
  const handleQuickAccess = useCallback((type: typeof QUICK_ACCESS_OPTIONS[number]['value']) => {
    switch (type) {
      case 'starred':
        setFilters({ isStarred: filters.isStarred ? undefined : true })
        break
      case 'pinned':
        setFilters({ isPinned: filters.isPinned ? undefined : true })
        break
      case 'sharedWithMe':
        setFilters({ sharedWithMe: filters.sharedWithMe ? undefined : true })
        break
      case 'sharedByMe':
        setFilters({ sharedByMe: filters.sharedByMe ? undefined : true })
        break
    }
  }, [filters.isStarred, filters.isPinned, filters.sharedWithMe, filters.sharedByMe, setFilters])

  // Clear all filters
  const handleClearAll = useCallback(() => {
    clearFilters()
    setSearchQuery('')
    setDateRange(undefined)
    setIsAdvancedOpen(false)
  }, [clearFilters])

  // Count active filters
  const activeFilterCount = [
    filters.status,
    filters.type,
    filters.searchQuery,
    filters.tags?.length,
    filters.dateRange,
    filters.isStarred,
    filters.isPinned,
    filters.sharedWithMe,
    filters.sharedByMe,
  ].filter(Boolean).length

  // Mobile compact view
  if (compact && isMobile) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFilters}
          className={cn(
            "gap-2",
            activeFilterCount > 0 && "border-primary text-primary"
          )}
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Access Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {QUICK_ACCESS_OPTIONS.map((option) => {
          const Icon = option.icon
          const isActive =
            (option.value === 'starred' && filters.isStarred) ||
            (option.value === 'pinned' && filters.isPinned) ||
            (option.value === 'sharedWithMe' && filters.sharedWithMe) ||
            (option.value === 'sharedByMe' && filters.sharedByMe)
          return (
            <Button
              key={option.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickAccess(option.value)}
              className="gap-1.5 whitespace-nowrap"
            >
              <Icon className={cn("h-4 w-4", !isActive && option.color)} />
              {option.label}
            </Button>
          )
        })}
      </div>

      {/* Search and quick filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Quick status filters */}
          <div className="hidden sm:flex items-center gap-1">
            {STATUS_OPTIONS.slice(0, 4).map((status) => {
              const Icon = status.icon
              const isActive = filters.status === status.value
              return (
                <Button
                  key={status.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange(status.value)}
                  className={cn(
                    "gap-1 text-xs",
                    !isActive && "hover:bg-muted"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {status.label}
                </Button>
              )
            })}
          </div>

          {/* Advanced filters toggle */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-2",
                  activeFilterCount > 0 && "border-primary text-primary"
                )}
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                {isAdvancedOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      <Collapsible open={isAdvancedOpen}>
        <CollapsibleContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Document type filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <ClientSelect
                  value={filters.type || 'all'}
                  onValueChange={handleTypeChange}
                >
                  <ClientSelectTrigger>
                    <ClientSelectValue />
                  </ClientSelectTrigger>
                  <ClientSelectContent>
                    {TYPE_OPTIONS.map((type) => (
                      <ClientSelectItem key={type.value} value={type.value}>
                        {type.label}
                      </ClientSelectItem>
                    ))}
                  </ClientSelectContent>
                </ClientSelect>
              </div>

              {/* Date range filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <ClientPopover>
                  <ClientPopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </Button>
                  </ClientPopoverTrigger>
                  <ClientPopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      initialFocus
                      required={false}
                    />
                  </ClientPopoverContent>
                </ClientPopover>
              </div>

              {/* Tags filter */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {tags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={filters.tags?.includes(tag.id) ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {tag.name}
                    </Badge>
                  ))}
                  {tags.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{tags.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* AI-powered suggestions */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Smart Suggestions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ status: 'inbox', type: undefined })}
                  className="text-xs"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  Inbox
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ status: 'active', type: undefined })}
                  className="text-xs"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Active
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ type: 'invoice', status: undefined })}
                  className="text-xs"
                >
                  <FileText className="mr-1 h-3 w-3" />
                  Invoices Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const lastWeek = new Date()
                    lastWeek.setDate(lastWeek.getDate() - 7)
                    handleDateRangeChange({ from: lastWeek, to: new Date() })
                  }}
                  className="text-xs"
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  Last Week
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
