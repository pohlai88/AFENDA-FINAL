/**
 * Public Loading State
 * Displays while public marketing pages are loading.
 *
 * Note: Header and footer are rendered by the parent layout,
 * so this skeleton only covers the content area.
 *
 * @domain marketing
 * @layer ui
 */

import { Skeleton } from "@afenda/shadcn";

export default function PublicLoading() {
  return (
    <div
      className="container mx-auto max-w-5xl px-4 py-16"
      aria-busy="true"
      aria-label="Loading page content"
    >
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
  );
}

