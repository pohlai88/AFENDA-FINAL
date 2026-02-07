/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Loading state for duplicates page
 */

import { Card, CardContent, CardHeader } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"

export default function DuplicatesLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading duplicates">
      <Card className="lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
