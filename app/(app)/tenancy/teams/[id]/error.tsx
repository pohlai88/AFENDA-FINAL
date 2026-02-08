"use client";

/**
 * Team Detail Error Boundary
 *
 * @domain tenancy
 * @layer ui
 */

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@afenda/shadcn";
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn";
import { Alert, AlertDescription, AlertTitle } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function TeamDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[Tenancy/Team] Error boundary:", error);
    }
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4"
      role="alert"
      aria-live="assertive"
    >
      <Card className="max-w-md w-full">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Team Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to load team</AlertTitle>
            <AlertDescription>
              {error.message || "Could not load team details. Please try again."}
            </AlertDescription>
          </Alert>
          {error.digest && (
            <p className="text-muted-foreground text-xs font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Button onClick={() => reset()} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={routes.ui.tenancy.teams.list()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Teams
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
