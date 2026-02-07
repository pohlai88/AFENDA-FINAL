"use client"

/**
 * Virtualized DataTable component for large datasets (10,000+ rows)
 * Uses @tanstack/react-virtual for efficient rendering
 */

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { Skeleton } from "./skeleton"

export interface DataTableVirtualizedProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  estimateRowHeight?: number
  overscan?: number
  enableRowSelection?: boolean
  enableMultiRowSelection?: boolean
  onRowSelectionChange?: (selectedRows: TData[]) => void
  enableColumnFilters?: boolean
  enableSorting?: boolean
  emptyState?: React.ReactNode
  className?: string
}

export function DataTableVirtualized<TData, TValue>({
  columns,
  data,
  loading = false,
  estimateRowHeight = 50,
  overscan = 10,
  enableRowSelection = false,
  enableMultiRowSelection = true,
  onRowSelectionChange,
  enableColumnFilters = true,
  enableSorting = true,
  emptyState,
  className,
}: DataTableVirtualizedProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection,
    enableMultiRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableColumnFilters ? getFilteredRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: enableColumnFilters ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableColumnFilters ? getFacetedUniqueValues() : undefined,
  })

  const { rows } = table.getRowModel()

  // Virtualization setup
  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
  })

  // Notify parent of row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, onRowSelectionChange, table])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="h-24 flex items-center justify-center">
          {emptyState || "No results."}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        ref={parentRef}
        className="rounded-md border overflow-auto"
        style={{ height: "600px" }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              <td style={{ display: "block", position: "relative" }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </td>
            </tr>
          </TableBody>
        </Table>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        Showing {rowVirtualizer.getVirtualItems().length} of {rows.length} rows
      </div>
    </div>
  )
}
