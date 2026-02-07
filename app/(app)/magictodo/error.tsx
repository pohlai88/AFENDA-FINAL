"use client";

/**
 * Error boundary for MagicTodo routes. Uses routes from shared constants.
 *
 * @layer route-ui
 */

import { useEffect } from "react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";

interface MagictodoErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MagictodoError({ error, reset }: MagictodoErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- error boundary dev logging
      console.error("[MagicTodo] Error boundary:", error);
    }
  }, [error]);

  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      role="alert"
      aria-live="assertive"
      aria-labelledby="magictodo-error-title"
    >
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <CardTitle id="magictodo-error-title">Something went wrong</CardTitle>
          </div>
          <CardDescription>
            An error occurred while loading MagicTodo. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} variant="default" className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={routes.ui.magictodo.dashboard()}>
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
