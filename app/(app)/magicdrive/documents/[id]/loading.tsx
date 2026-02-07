/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Loading state for document detail page
 */

import { Card, CardContent, CardHeader } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"

export default function DocumentDetailLoading() {
  return (
    <div className="h-full" aria-busy="true" aria-label="Loading document">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row h-full">
            <div className="flex-1 bg-muted/30 flex items-center justify-center min-h-[400px]">
              <Skeleton className="h-96 w-96" />
            </div>
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l p-4 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
