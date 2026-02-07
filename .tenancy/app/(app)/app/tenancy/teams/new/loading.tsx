/**
 * Loading state for new team page
 * Shows skeleton while async data is being fetched
 */

import { Skeleton } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"

export default function NewTeamLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-80" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
