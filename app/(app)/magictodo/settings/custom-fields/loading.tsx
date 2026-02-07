/**
 * @domain magictodo
 * @layer ui
 * @responsibility Loading state for Custom Fields settings
 */

import { Skeleton } from "@afenda/shadcn"
import { Card, CardContent } from "@afenda/shadcn"

export default function CustomFieldsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading custom fields">
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 py-4">
              <Skeleton className="h-5 w-5 shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-9 shrink-0 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
