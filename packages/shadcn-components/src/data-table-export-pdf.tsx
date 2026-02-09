"use client"

/**
 * PDF Export Utility for DataTable
 * Exports table data to PDF format with customizable templates
 */

import * as React from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { IconFileTypePdf } from "@tabler/icons-react"
import { Button } from "./button"

export interface PDFExportOptions {
  filename?: string
  title?: string
  subtitle?: string
  orientation?: "portrait" | "landscape"
  pageSize?: "a4" | "letter" | "legal"
  includeHeaders?: boolean
  includeFooter?: boolean
  headerColor?: string
  alternateRowColor?: string
  fontSize?: number
  formatters?: Record<string, (value: unknown) => string>
}

/**
 * Export data to PDF file
 */
export function exportToPDF<TData extends Record<string, unknown>>(
  data: TData[],
  columns: Array<{ key: string; header: string; width?: number }>,
  options: PDFExportOptions = {}
) {
  const {
    filename = `export-${new Date().toISOString().split("T")[0]}.pdf`,
    title = "Data Export",
    subtitle,
    orientation = "landscape",
    pageSize = "a4",
    includeHeaders = true,
    includeFooter = true,
    headerColor = "#3b82f6", // Defaults match light theme primary/muted; pass theme-derived hex if needed for PDF
    alternateRowColor = "#f9fafb",
    fontSize = 10,
    formatters = {},
  } = options

  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: pageSize,
  })

  // Add title
  doc.setFontSize(16)
  doc.setTextColor(40, 40, 40)
  doc.text(title, 14, 15)

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, 14, 22)
  }

  // Prepare table data
  const headers = includeHeaders ? [columns.map((col) => col.header)] : []
  
  const body = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key]
      
      // Apply formatter if available
      if (formatters[col.key]) {
        return formatters[col.key](value)
      }
      
      // Handle dates
      if (value instanceof Date) {
        return value.toLocaleDateString()
      }
      
      // Handle objects
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value)
      }
      
      return String(value ?? "")
    })
  )

  // Generate table
  autoTable(doc, {
    head: headers,
    body: body,
    startY: subtitle ? 28 : 22,
    theme: "striped",
    headStyles: {
      fillColor: headerColor,
      textColor: "#ffffff",
      fontSize: fontSize,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fontSize: fontSize - 1,
      textColor: "#374151",
    },
    alternateRowStyles: {
      fillColor: alternateRowColor,
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width }
      }
      return acc
    }, {} as Record<number, { cellWidth: number }>),
    margin: { top: 10, right: 14, bottom: 10, left: 14 },
    didDrawPage: (data) => {
      // Add footer with page numbers
      if (includeFooter) {
        const pageCount = doc.getNumberOfPages()
        const pageHeight = doc.internal.pageSize.height
        
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          pageHeight - 10
        )
        
        // Add timestamp
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          doc.internal.pageSize.width - 60,
          pageHeight - 10
        )
      }
    },
  })

  // Save PDF
  doc.save(filename)
}

/**
 * PDF Export Button Component
 */
export interface PDFExportButtonProps<TData extends Record<string, unknown>> {
  data: TData[]
  columns: Array<{ key: string; header: string; width?: number }>
  options?: PDFExportOptions
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function PDFExportButton<TData extends Record<string, unknown>>({
  data,
  columns,
  options,
  variant = "outline",
  size = "sm",
  className,
  children,
}: PDFExportButtonProps<TData>) {
  const handleExport = React.useCallback(() => {
    exportToPDF(data, columns, options)
  }, [data, columns, options])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      className={className}
      aria-label="Export to PDF"
    >
      <IconFileTypePdf className="mr-2 size-4" />
      {children || "Export PDF"}
    </Button>
  )
}
