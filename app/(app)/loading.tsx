/**
 * App Loading State
 * Displays while authenticated pages are loading.
 */

import { Skeleton } from "@afenda/shadcn";

export default function Loading() {
    return (
        <div className="flex h-screen" aria-busy="true" aria-label="Loading application">
            {/* Sidebar skeleton */}
            <div className="w-64 border-r p-4 space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>

            {/* Main content skeleton */}
            <div className="flex-1 p-6 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-64 w-full" />
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        </div>
    );
}
