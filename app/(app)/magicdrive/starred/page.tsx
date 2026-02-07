/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive starred page - starred/favorite files
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Star } from "lucide-react"

export default function StarredPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Starred Files</h1>
          <p className="text-muted-foreground">Files you&apos;ve marked as favorites</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Starred Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No starred files</p>
            <p className="text-sm text-muted-foreground mt-2">
              Star files to quickly access them here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
