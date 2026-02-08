"use client"

/**
 * Enterprise-grade DataTable component with TanStack Table
 * Features: sorting, filtering, pagination, row selection, column visibility
 */

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
  type ColumnOrderState,
  type ColumnPinningState,
  type OnChangeFn,
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

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  pageSize?: number
  enableRowSelection?: boolean
  enableMultiRowSelection?: boolean
  onRowSelectionChange?: (selectedRows: TData[]) => void
  enableColumnFilters?: boolean
  enableSorting?: boolean
  enablePagination?: boolean
  manualPagination?: boolean
  pageCount?: number
  onPaginationChange?: OnChangeFn<PaginationState>
  enableColumnOrdering?: boolean
  columnOrder?: ColumnOrderState
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>
  enableColumnPinning?: boolean
  columnPinning?: ColumnPinningState
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>
  emptyState?: React.ReactNode
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  pageSize = 10,
  enableRowSelection = false,
  enableMultiRowSelection = true,
  onRowSelectionChange,
  enableColumnFilters = true,
  enableSorting = true,
  enablePagination = true,
  manualPagination = false,
  pageCount,
  onPaginationChange,
  enableColumnOrdering = false,
  columnOrder: controlledColumnOrder,
  onColumnOrderChange,
  enableColumnPinning = false,
  columnPinning: controlledColumnPinning,
  onColumnPinningChange,
  emptyState,
  className,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    controlledColumnOrder || []
  )
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: [],
    right: [],
    ...controlledColumnPinning,
  })

  // Ensure columnPinning always has valid left/right arrays
  const safeColumnPinning = React.useMemo(() => ({
    left: controlledColumnPinning?.left ?? columnPinning.left ?? [],
    right: controlledColumnPinning?.right ?? columnPinning.right ?? [],
  }), [controlledColumnPinning, columnPinning])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      columnOrder: enableColumnOrdering ? (controlledColumnOrder || columnOrder) : undefined,
      columnPinning: safeColumnPinning,
    },
    enableRowSelection,
    enableMultiRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: manualPagination ? onPaginationChange : setPagination,
    onColumnOrderChange: enableColumnOrdering ? (onColumnOrderChange || setColumnOrder) : undefined,
    onColumnPinningChange: enableColumnPinning ? (onColumnPinningChange || setColumnPinning) : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableColumnFilters ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination && !manualPagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: enableColumnFilters ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableColumnFilters ? getFacetedUniqueValues() : undefined,
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
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
        {Array.from({ length: pageSize }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyState || "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
