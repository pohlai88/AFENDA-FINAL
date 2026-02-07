/**
 * @domain magictodo
 * @layer ui
 * @responsibility Loading state for task edit page
 */

import { Card, CardContent, CardHeader } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"

export default function TaskEditLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading task">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
