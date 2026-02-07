/**
 * @domain magictodo
 * @layer ui
 * @responsibility Loading state for Kanban view
 */

import { Skeleton } from "@afenda/shadcn"
import { BoardViewSkeleton } from "../_components";

export default function KanbanLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Kanban">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <BoardViewSkeleton />
    </div>
  )
}
