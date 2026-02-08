/**
 * @domain magictodo
 * @layer ui
 * @responsibility Loading state for Focus Mode view
 */

import { Skeleton } from "@afenda/shadcn"

export default function FocusLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading focus mode">
      <div className="text-center space-y-2">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>
      <div className="flex justify-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-16 w-32" />
      </div>
      <div className="space-y-3 max-w-md mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
