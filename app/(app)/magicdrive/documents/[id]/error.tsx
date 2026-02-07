/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Error state for document detail page
 */

"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { routes } from "@afenda/shared/constants"

export default function DocumentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
       
      console.error("[MagicDrive DocumentDetail] Error boundary:", error)
    }
  }, [error])

  return (
    <div
      className="h-full flex items-center justify-center p-4"
      role="alert"
      aria-live="assertive"
      aria-labelledby="document-error-title"
      aria-describedby="document-error-desc"
    >
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive" aria-hidden />
          <h2 id="document-error-title" className="text-2xl font-bold text-center">
            Failed to Load Document
          </h2>
          <p id="document-error-desc" className="text-muted-foreground text-center">
            {error.message || "An error occurred while loading the document. Please try again."}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild aria-label="Return to documents list">
              <Link href={routes.ui.magicdrive.documents()}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Back to Documents
              </Link>
            </Button>
            <Button onClick={reset} aria-label="Retry loading document">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
