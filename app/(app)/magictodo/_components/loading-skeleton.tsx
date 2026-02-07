/**
 * Reusable loading skeletons for MagicTodo sub-routes (list and board views).
 * Used by loading.tsx for streaming with Suspense.
 *
 * @layer route-ui
 */

import { Skeleton } from "@afenda/shadcn";
import { Card, CardContent } from "@afenda/shadcn";

/** Compact skeleton for list/table views */
export function ListViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 py-4">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for board/kanban-style views */
export function BoardViewSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-72 shrink-0 space-y-2">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Card key={j}>
                <CardContent className="py-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
