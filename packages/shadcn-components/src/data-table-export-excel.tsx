"use client"

/**
 * Excel Export Utility for DataTable
 * Exports table data to Excel format with formatting
 */

import * as React from "react"
import * as XLSX from "xlsx"
import { IconFileSpreadsheet } from "@tabler/icons-react"
import { Button } from "./button"

export interface ExcelExportOptions {
  filename?: string
  sheetName?: string
  includeHeaders?: boolean
  formatters?: Record<string, (value: unknown) => string | number>
}

/**
 * Export data to Excel file
 */
export function exportToExcel<TData extends Record<string, unknown>>(
  data: TData[],
  columns: Array<{ key: string; header: string }>,
  options: ExcelExportOptions = {}
) {
  const {
    filename = `export-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName = "Sheet1",
    includeHeaders = true,
    formatters = {},
  } = options

  // Prepare data for Excel
  const excelData: unknown[][] = []

  // Add headers
  if (includeHeaders) {
    excelData.push(columns.map((col) => col.header))
  }

  // Add data rows
  data.forEach((row) => {
    const rowData = columns.map((col) => {
      const value = row[col.key]
      
      // Apply formatter if available
      if (formatters[col.key]) {
        return formatters[col.key](value)
      }
      
      // Handle dates
      if (value instanceof Date) {
        return value.toISOString()
      }
      
      // Handle objects
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value)
      }
      
      return value
    })
    excelData.push(rowData)
  })

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)

  // Auto-size columns
  const colWidths = columns.map((col, i) => {
    const maxLength = Math.max(
      col.header.length,
      ...excelData.slice(1).map((row) => String(row[i] || "").length)
    )
    return { wch: Math.min(maxLength + 2, 50) }
  })
  ws["!cols"] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate Excel file and download
  XLSX.writeFile(wb, filename)
}

/**
 * Excel Export Button Component
 */
export interface ExcelExportButtonProps<TData extends Record<string, unknown>> {
  data: TData[]
  columns: Array<{ key: string; header: string }>
  options?: ExcelExportOptions
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function ExcelExportButton<TData extends Record<string, unknown>>({
  data,
  columns,
  options,
  variant = "outline",
  size = "sm",
  className,
  children,
}: ExcelExportButtonProps<TData>) {
  const handleExport = React.useCallback(() => {
    exportToExcel(data, columns, options)
  }, [data, columns, options])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      className={className}
      aria-label="Export to Excel"
    >
      <IconFileSpreadsheet className="mr-2 size-4" />
      {children || "Export Excel"}
    </Button>
  )
}
