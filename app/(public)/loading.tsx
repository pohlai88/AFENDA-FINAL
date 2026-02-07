/**
 * Public Loading State
 * Displays while public marketing pages are loading.
 */

import { Skeleton } from "@afenda/shadcn";

export default function PublicLoading() {
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true" aria-label="Loading">
      {/* Header skeleton */}
      <div className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 container mx-auto max-w-5xl px-4 py-16">
        <div className="space-y-8">
          {/* Hero section */}
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-full max-w-2xl" />
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-40" />
          </div>

          {/* Content cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

