/**
 * Marketing Loading State
 * Displays while marketing pages are loading.
 * Shows skeleton UI appropriate for marketing content.
 *
 * @domain marketing
 * @layer ui/marketing
 */

import { Skeleton } from "@afenda/shadcn";

export default function MarketingLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16" aria-busy="true" aria-label="Loading content">
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>

        {/* CTA buttons skeleton */}
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-12 w-48" />
        </div>

        {/* Content cards skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>

        {/* Additional content skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
