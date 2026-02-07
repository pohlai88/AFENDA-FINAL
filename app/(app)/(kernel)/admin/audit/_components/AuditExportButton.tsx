"use client";

/**
 * Audit Export Button
 * Export audit entries as signed CSV.
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { IconDownload } from "@tabler/icons-react";

import { Button } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { toast } from "sonner";

export function AuditExportButton() {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Build export URL with current filters (audit/ops supports ?format=csv)
      const params = new URLSearchParams(searchParams.toString());
      params.set("format", "csv");

      const response = await fetch(`${routes.api.orchestra.auditExport()}?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? `audit-export-${Date.now()}.csv`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export downloaded", { description: filename });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Could not download audit export",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <IconDownload className={`mr-2 size-4 ${isExporting ? "animate-pulse" : ""}`} />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
