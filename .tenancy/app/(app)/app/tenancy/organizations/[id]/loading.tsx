/**
 * Loading state for organization detail page
 * Shows skeleton while async data is being fetched
 */

import { Skeleton } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"

export default function OrganizationLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
