/**
 * Loading state for organization teams page
 * Shows skeleton while async data is being fetched
 */

import { Skeleton } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"

export default function OrganizationTeamsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-72" />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  )
}
