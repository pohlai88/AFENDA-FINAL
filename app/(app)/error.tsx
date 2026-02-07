"use client";

import * as React from "react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { Button } from "@afenda/shadcn";
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn";
import { Alert, AlertDescription, AlertTitle } from "@afenda/shadcn";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
       
      console.error("[App Error]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: "authenticated-app",
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
      });
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Application Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Occurred</AlertTitle>
              <AlertDescription>
                {error.message || "An unexpected error occurred in the application. Please try again."}
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
                <Link href={routes.ui.orchestra.dashboard()}>
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              If this error persists, please contact{" "}
              <a href="mailto:legal@nexuscanon.com" className="underline">
                legal@nexuscanon.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
