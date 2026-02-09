/**
 * @domain magictodo
 * @layer ui
 * @responsibility Table view content (lazy-loaded by page.tsx)
 * Virtual scrolling, inline editing, column resizing, drag-drop, keyboard nav, custom fields
 */

"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ColumnResizeMode,
  type ColumnOrderState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useUser } from "@/app/_components/user-context"
import { Alert, AlertDescription } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Checkbox } from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuCheckboxItem,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Columns,
  Filter,
  Search,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"
import { routes } from "@afenda/shared/constants"
import {
  useTasksQuery,
  useUpdateTaskMutation,
  type TaskResponse,
} from "@afenda/magictodo"
import {
  type Attachment,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  PriorityBadge,
  StatusCell,
  SortableHeader,
  EditableTextCell,
  EditableSelectCell,
  EditableDateCell,
  PinStarCell,
  AttachmentPreviewCell,
} from "./_components/table-cells"
import { formatDate } from "./_components/table-utils"

// ─── Types ───────────────────────────────────────────────────────────

interface CustomFieldDef {
  id: string
  name: string
  fieldType: string
  alias?: string
}

interface EditingCell {
  rowId: string
  columnId: string
}

// Extended task for table view (TaskResponse from zod)
type TableTask = TaskResponse & {
  isExpanded?: boolean
  children?: TableTask[]
  attachments?: Attachment[]
}


export default function TableViewPage() {
  const { user, isLoading, isAuthenticated } = useUser()
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnResizeMode] = useState<ColumnResizeMode>("onChange")
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

  // Editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null)

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([])

  // DnD sensors for column reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Track client mount for hydration safety
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading, error } = useTasksQuery(
    { sortBy: "dueDate", sortOrder: "asc" },
    { enabled: !!user?.id }
  )

  const updateTaskMutation = useUpdateTaskMutation()

  // Fetch custom fields (optional - endpoint may not exist yet)
  useEffect(() => {
    if (!user?.id) return
    async function fetchCustomFields() {
      try {
        const res = await fetch(`${routes.api.magictodo.bff.root()}/custom-fields`)
        if (res.ok) {
          const data = await res.json()
          setCustomFields(data.data?.items ?? data.data ?? [])
        }
      } catch {
        // Silently fail if custom fields endpoint doesn't exist
      }
    }
    fetchCustomFields()
  }, [user?.id])

  // Convert tasks to table format
  const tableData = useMemo<TableTask[]>(() => {
    const tasks = tasksData?.items ?? []
    // Return tasks sorted by due date (API already sorts, but ensure consistency)
    return [...tasks] as TableTask[]
  }, [tasksData?.items])

  // Update handlers
  const handleUpdateTask = useCallback(
    (taskId: string, field: string, value: unknown) => {
      updateTaskMutation.mutate({
        id: taskId,
        data: { [field]: value },
      })
    },
    [updateTaskMutation]
  )

  const handleTogglePin = useCallback(
    (task: TableTask) => {
      handleUpdateTask(task.id, "isPinned", !task.isPinned)
    },
    [handleUpdateTask]
  )

  const handleToggleStar = useCallback(
    (task: TableTask) => {
      handleUpdateTask(task.id, "isStarred", !task.isStarred)
    },
    [handleUpdateTask]
  )

  // Create columns with editing support
  const columns = useMemo<ColumnDef<TableTask>[]>(() => {
    const baseCols: ColumnDef<TableTask>[] = [
      // Selection checkbox
      {
        id: "select",
        size: 40,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableResizing: false,
      },
      // Pin/Star toggle
      {
        id: "pinStar",
        size: 60,
        header: "",
        cell: ({ row }) => (
          <PinStarCell
            isPinned={row.original.isPinned}
            isStarred={row.original.isStarred}
            onTogglePin={() => handleTogglePin(row.original)}
            onToggleStar={() => handleToggleStar(row.original)}
          />
        ),
        enableSorting: false,
        enableResizing: false,
      },
      // Expand/Collapse (for hierarchy)
      {
        id: "expand",
        size: 40,
        header: "",
        cell: ({ row }) => {
          const task = row.original
          const hasChildren = task.children && task.children.length > 0
          if (!hasChildren) return null
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => row.toggleExpanded()}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )
        },
        enableSorting: false,
        enableResizing: false,
      },
      // Status (editable)
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        cell: ({ row }) => (
          <EditableSelectCell
            value={row.original.status}
            options={STATUS_OPTIONS}
            onSave={(v) => handleUpdateTask(row.original.id, "status", v)}
            renderValue={(v) => <StatusCell status={v} />}
          />
        ),
      },
      // Title (editable)
      {
        accessorKey: "title",
        header: "Title",
        size: 300,
        minSize: 150,
        cell: ({ row }) => {
          const task = row.original
          const depth = task.level ?? 0
          const isEditing = editingCell?.rowId === task.id && editingCell?.columnId === "title"
          return (
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${depth * 20}px` }}
            >
              <EditableTextCell
                value={task.title}
                isEditing={isEditing}
                onStartEdit={() => setEditingCell({ rowId: task.id, columnId: "title" })}
                onCancelEdit={() => setEditingCell(null)}
                onSave={(v) => {
                  handleUpdateTask(task.id, "title", v)
                  setEditingCell(null)
                }}
              />
              {task.hierarchyCode && (
                <span className="text-xs text-muted-foreground font-mono">
                  {task.hierarchyCode}
                </span>
              )}
            </div>
          )
        },
      },
      // Priority (editable)
      {
        accessorKey: "priority",
        header: "Priority",
        size: 100,
        cell: ({ row }) => (
          <EditableSelectCell
            value={row.original.priority}
            options={PRIORITY_OPTIONS}
            onSave={(v) => handleUpdateTask(row.original.id, "priority", v)}
            renderValue={(v) => <PriorityBadge priority={v} />}
          />
        ),
      },
      // Due Date (editable)
      {
        accessorKey: "dueDate",
        header: "Due Date",
        size: 120,
        cell: ({ row }) => (
          <EditableDateCell
            value={row.original.dueDate ?? null}
            onSave={(v) => handleUpdateTask(row.original.id, "dueDate", v)}
          />
        ),
      },
      // Tags
      {
        accessorKey: "tags",
        header: "Tags",
        size: 150,
        cell: ({ getValue }) => {
          const tags = getValue() as string[] | null
          if (!tags || tags.length === 0) return null
          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )
        },
      },
      // Attachments
      {
        id: "attachments",
        header: "Files",
        size: 60,
        cell: ({ row }) => <AttachmentPreviewCell attachments={row.original.attachments} />,
        enableSorting: false,
      },
      // Created At
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(getValue() as string)}
          </span>
        ),
      },
    ]

    // Add custom field columns dynamically
    const customCols: ColumnDef<TableTask>[] = customFields.map((field) => ({
      id: `custom_${field.id}`,
      header: field.alias || field.name,
      size: 120,
      cell: () => (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    }))

    return [...baseCols, ...customCols]
  }, [customFields, editingCell, handleUpdateTask, handleTogglePin, handleToggleStar])

  // Initialize column order when columns change
  useEffect(() => {
    if (columnOrder.length === 0 && columns.length > 0) {
      const ids = columns.map((c) => {
        const col = c as { id?: string; accessorKey?: string }
        return col.id ?? String(col.accessorKey ?? "")
      })
      setColumnOrder(ids)
    }
  }, [columns, columnOrder.length])

  // Table instance (TanStack Table API is not fully memoization-safe; compiler skips this component)
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable returns unstable refs
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode,
    enableColumnResizing: true,
  })

  // Virtual scrolling
  const { rows } = table.getRowModel()
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48, // Row height
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0

  // Column drag end handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setColumnOrder((prev) => {
        const oldIndex = prev.indexOf(String(active.id))
        const newIndex = prev.indexOf(String(over.id))
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focusedCell) return

      const { rowIndex, colIndex } = focusedCell
      const visibleCols = table.getVisibleFlatColumns()

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          if (rowIndex > 0) {
            setFocusedCell({ rowIndex: rowIndex - 1, colIndex })
          }
          break
        case "ArrowDown":
          e.preventDefault()
          if (rowIndex < rows.length - 1) {
            setFocusedCell({ rowIndex: rowIndex + 1, colIndex })
          }
          break
        case "ArrowLeft":
          e.preventDefault()
          if (colIndex > 0) {
            setFocusedCell({ rowIndex, colIndex: colIndex - 1 })
          }
          break
        case "ArrowRight":
          e.preventDefault()
          if (colIndex < visibleCols.length - 1) {
            setFocusedCell({ rowIndex, colIndex: colIndex + 1 })
          }
          break
        case "Enter":
          e.preventDefault()
          const row = rows[rowIndex]
          const col = visibleCols[colIndex]
          if (row && col && col.id === "title") {
            setEditingCell({ rowId: row.original.id, columnId: "title" })
          }
          break
        case "Escape":
          setEditingCell(null)
          setFocusedCell(null)
          break
      }
    },
    [focusedCell, rows, table]
  )

  // Prevent hydration mismatch by rendering consistent skeleton on server and initial client render
  if (!isMounted) {
    return (
      <div className="p-4 space-y-4" suppressHydrationWarning>
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-[60vh] w-full animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  // Auth guards
  if (isLoading) {
    return (
      <div className="p-4">
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Loading authentication...</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAuthenticated || !user?.id) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Not authenticated. Please log in.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Failed to load tasks: {String(error)}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-4" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Table View</h1>
          <p className="text-muted-foreground">
            {tableData.length} tasks • {Object.keys(rowSelection).length} selected
            {customFields.length > 0 && ` • ${customFields.length} custom fields`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          {/* Column Visibility */}
          <ClientDropdownMenu>
            <ClientDropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </ClientDropdownMenuTrigger>
            <ClientDropdownMenuContent align="end" className="max-h-80 overflow-auto">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <ClientDropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace("custom_", "")}
                  </ClientDropdownMenuCheckboxItem>
                ))}
            </ClientDropdownMenuContent>
          </ClientDropdownMenu>
        </div>
      </div>

      {/* Table Container with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={tableContainerRef}
          className="flex-1 overflow-auto border rounded-lg bg-background focus:outline-none"
        >
          {tasksLoading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse">
              {/* Header with sortable columns */}
              <thead className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    <SortableContext
                      items={columnOrder}
                      strategy={horizontalListSortingStrategy}
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="relative px-4 py-3 text-left text-sm font-medium border-b select-none"
                          style={{
                            width: header.getSize(),
                            minWidth: header.column.columnDef.minSize,
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <SortableHeader headerId={header.id}>
                              <div
                                className={cn(
                                  "flex items-center gap-1",
                                  header.column.getCanSort() && "cursor-pointer hover:text-foreground"
                                )}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getCanSort() && (
                                  <>
                                    {header.column.getIsSorted() === "asc" ? (
                                      <ArrowUp className="h-3 w-3" />
                                    ) : header.column.getIsSorted() === "desc" ? (
                                      <ArrowDown className="h-3 w-3" />
                                    ) : (
                                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    )}
                                  </>
                                )}
                              </div>
                            </SortableHeader>
                          )}
                          {/* Column Resize Handle */}
                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={cn(
                                "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none",
                                header.column.getIsResizing() && "bg-primary"
                              )}
                            />
                          )}
                        </th>
                      ))}
                    </SortableContext>
                  </tr>
                ))}
              </thead>

              {/* Body with Virtual Scrolling */}
              <tbody>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  const isFocused = focusedCell?.rowIndex === virtualRow.index
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b hover:bg-muted/50 transition-colors",
                        row.getIsSelected() && "bg-muted",
                        isFocused && "ring-2 ring-inset ring-primary"
                      )}
                      onClick={() => setFocusedCell({ rowIndex: virtualRow.index, colIndex: 0 })}
                    >
                      {row.getVisibleCells().map((cell, colIdx) => (
                        <td
                          key={cell.id}
                          className={cn(
                            "px-4 py-3",
                            focusedCell?.rowIndex === virtualRow.index &&
                              focusedCell?.colIndex === colIdx &&
                              "bg-accent"
                          )}
                          style={{ width: cell.column.getSize() }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setFocusedCell({ rowIndex: virtualRow.index, colIndex: colIdx })
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Empty State */}
          {!tasksLoading && tableData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No tasks found</h3>
              <p className="text-muted-foreground mt-1">
                Create your first task to get started
              </p>
            </div>
          )}
        </div>
      </DndContext>

      {/* Footer with Selection Actions */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm">
            {Object.keys(rowSelection).length} task(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRowSelection({})}>
              Clear Selection
            </Button>
            <Button variant="default" size="sm">
              Bulk Actions
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="text-xs text-muted-foreground flex items-center gap-4">
        <span>↑↓←→ Navigate</span>
        <span>Enter Edit</span>
        <span>Esc Cancel</span>
        <span>Drag headers to reorder columns</span>
      </div>
    </div>
  )
}
