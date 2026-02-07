/**
 * Loading state for team detail page
 * Shows skeleton while async data is being fetched
 */

import { Skeleton } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"

export default function TeamDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-80" />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  )
}
