/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive videos page - video file browser
 */

"use client"

import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Video, Upload } from "lucide-react"

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
          <p className="text-muted-foreground">Browse and manage your video files</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Videos
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No videos uploaded yet</p>
            <Button className="mt-4">
              <Upload className="mr-2 h-4 w-4" />
              Upload Your First Video
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
