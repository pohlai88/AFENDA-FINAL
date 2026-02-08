/**
 * @domain magictodo
 * @layer ui
 * @responsibility Loading state for Hierarchy view
 */

import { Skeleton } from "@afenda/shadcn"

export default function HierarchyLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading hierarchy">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
