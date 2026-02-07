/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Loading state for files page
 */

import { Card, CardContent, CardHeader } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"

export default function FilesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading files">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
