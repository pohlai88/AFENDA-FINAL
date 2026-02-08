/**
 * @domain magictodo
 * @layer ui
 * @responsibility Loading state for Gantt view
 */

import { Skeleton } from "@afenda/shadcn"

export default function GanttLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Gantt chart">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[500px] w-full rounded-lg" />
    </div>
  )
}
