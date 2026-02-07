/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive recent page - recently accessed files
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Clock } from "lucide-react"

export default function RecentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recent Files</h1>
          <p className="text-muted-foreground">Files you&apos;ve recently accessed</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recently Accessed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No recent files</p>
            <p className="text-sm text-muted-foreground mt-2">
              Files you access will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
