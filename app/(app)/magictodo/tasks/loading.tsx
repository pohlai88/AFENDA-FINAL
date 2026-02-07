/**
 * @domain magictodo
 * @layer ui
 * @responsibility Loading state for tasks list with skeleton UI
 */

import { Skeleton } from "@afenda/shadcn"
import { Card, CardContent, CardHeader } from "@afenda/shadcn"

export default function TasksLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading tasks">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Skeleton className="h-5 w-5 rounded mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
