/**
 * @domain magictodo
 * @layer ui
 * @responsibility Loading state for Calendar view
 */

import { Skeleton } from "@afenda/shadcn"

export default function CalendarLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading calendar">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  )
}
