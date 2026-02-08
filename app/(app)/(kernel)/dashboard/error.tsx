/**
 * Dashboard route error boundary
 * @layer page
 * @responsibility Graceful error recovery per Next.js production checklist
 */

"use client";

import { useEffect } from "react";
import { Button } from "@afenda/shadcn";
import { Card, CardContent } from "@afenda/shadcn";
import { IconAlertTriangle } from "@tabler/icons-react";
import { logger } from "@afenda/shared";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Dashboard Error boundary", error, { component: "DashboardError", digest: error.digest });
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] p-6"
      role="alert"
      aria-live="assertive"
      aria-labelledby="dashboard-error-title"
    >
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center py-12 space-y-4">
          <IconAlertTriangle
            className="h-12 w-12 text-destructive"
            aria-hidden
          />
          <h2 id="dashboard-error-title" className="text-xl font-semibold">
            Dashboard failed to load
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            An error occurred while loading the dashboard. Please try again.
          </p>
          <Button onClick={reset} variant="outline" aria-label="Retry loading dashboard">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
