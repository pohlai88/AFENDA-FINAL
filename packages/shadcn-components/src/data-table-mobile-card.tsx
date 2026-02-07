"use client"

/**
 * Mobile Card View for DataTable
 * Responsive alternative to table layout for mobile devices
 */

import * as React from "react"
import { type Row } from "@tanstack/react-table"

import { Card, CardContent, CardHeader } from "./card"
import { Checkbox } from "./checkbox"
import { Separator } from "./separator"

export interface DataTableMobileCardProps<TData> {
  rows: Row<TData>[]
  renderCard: (row: Row<TData>) => React.ReactNode
  enableRowSelection?: boolean
  emptyState?: React.ReactNode
}

/**
 * Default card renderer - can be overridden with custom renderCard prop
 */
export function DefaultMobileCard<TData>({ row }: { row: Row<TData> }) {
  const cells = row.getVisibleCells()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* First cell as title */}
            {cells[0] && (
              <div className="font-medium">
                {String(cells[0].getValue())}
              </div>
            )}
          </div>
          {row.getCanSelect() && (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Remaining cells as key-value pairs */}
        {cells.slice(1).map((cell, index) => {
          const columnDef = cell.column.columnDef
          const header = typeof columnDef.header === "string"
            ? columnDef.header
            : cell.column.id

          return (
            <div key={cell.id}>
              {index > 0 && <Separator className="my-2" />}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{header}</span>
                <span className="font-medium">{String(cell.getValue())}</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

/**
 * Mobile card view component
 */
export function DataTableMobileCard<TData>({
  rows,
  renderCard,
  enableRowSelection: _enableRowSelection = false,
  emptyState,
}: DataTableMobileCardProps<TData>) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        {emptyState || <p className="text-sm text-muted-foreground">No results.</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.id}>
          {renderCard ? renderCard(row) : <DefaultMobileCard row={row} />}
        </div>
      ))}
    </div>
  )
}

/**
 * Responsive DataTable wrapper that switches between table and card view
 */
export interface ResponsiveDataTableProps<TData> {
  rows: Row<TData>[]
  renderTable: () => React.ReactNode
  renderCard?: (row: Row<TData>) => React.ReactNode
  breakpoint?: number
  enableRowSelection?: boolean
  emptyState?: React.ReactNode
}

export function ResponsiveDataTable<TData>({
  rows,
  renderTable,
  renderCard,
  breakpoint = 768,
  enableRowSelection = false,
  emptyState,
}: ResponsiveDataTableProps<TData>) {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [breakpoint])

  if (isMobile) {
    return (
      <DataTableMobileCard
        rows={rows}
        renderCard={renderCard || ((row) => <DefaultMobileCard row={row} />)}
        enableRowSelection={enableRowSelection}
        emptyState={emptyState}
      />
    )
  }

  return <>{renderTable()}</>
}
