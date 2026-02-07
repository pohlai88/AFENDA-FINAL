/**
 * @domain magictodo
 * @layer ui
 * @responsibility Loading state for task detail page
 */

import { Card, CardContent, CardHeader } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"

export default function TaskDetailLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading task">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
