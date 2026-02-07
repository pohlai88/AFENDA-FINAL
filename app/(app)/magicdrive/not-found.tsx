/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive not found page
 */

import Link from "next/link"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { FolderOpen, ArrowLeft, Home } from "lucide-react"
import { routes } from "@afenda/shared/constants"

export default function MagicdriveNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>
            The MagicDrive page you&apos;re looking for doesn&apos;t exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={routes.ui.magicdrive.root()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to MagicDrive
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href={routes.ui.orchestra.root()}>
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
