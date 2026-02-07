/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Not found state for document detail page
 */

import { Card, CardContent } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { FileQuestion, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { routes } from "@afenda/shared/constants"

export default function DocumentNotFound() {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <FileQuestion className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-center">Document Not Found</h2>
          <p className="text-muted-foreground text-center">
            The document you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href={routes.ui.magicdrive.documents()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
