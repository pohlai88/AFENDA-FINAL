/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive shared page - shared files management
 */

"use client"

import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Share2, Users } from "lucide-react"

export default function SharedPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared Files</h1>
          <p className="text-muted-foreground">Manage files you&apos;ve shared with others</p>
        </div>
        <Button>
          <Share2 className="mr-2 h-4 w-4" />
          Share New File
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Shares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No files shared yet</p>
            <Button className="mt-4">
              <Share2 className="mr-2 h-4 w-4" />
              Share Your First File
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
