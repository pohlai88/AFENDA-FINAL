/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive trash page - deleted files
 */

"use client"

import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Trash2 } from "lucide-react"

export default function TrashPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
          <p className="text-muted-foreground">Deleted files (kept for 30 days)</p>
        </div>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Empty Trash
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Deleted Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Trash2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Trash is empty</p>
            <p className="text-sm text-muted-foreground mt-2">
              Deleted files will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
