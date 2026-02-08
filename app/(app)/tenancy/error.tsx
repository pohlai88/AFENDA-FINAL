"use client";

/**
 * Tenancy Error Boundary
 * Catches errors across all tenancy routes (organizations, teams, memberships).
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
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface TenancyErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TenancyError({ error, reset }: TenancyErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Development-only error logging
      console.error("[Tenancy] Error boundary:", error);
    }
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4"
      role="alert"
      aria-live="assertive"
      aria-labelledby="tenancy-error-title"
      aria-describedby="tenancy-error-desc"
    >
      <Card className="max-w-md w-full">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span id="tenancy-error-title">Tenancy Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription id="tenancy-error-desc">
              {error.message || "An error occurred in the tenancy module. Please try again."}
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
              <Link href={routes.ui.tenancy.root()}>
                <Home className="mr-2 h-4 w-4" />
                Back to Tenancy
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
