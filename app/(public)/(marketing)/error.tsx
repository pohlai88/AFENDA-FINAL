"use client";

/**
 * Marketing Error Boundary
 * Catches errors in marketing pages (home, privacy, terms, security).
 * Provides user-friendly error recovery for public visitors.
 *
 * @domain marketing
 * @layer ui/marketing
 */

import * as React from "react";
import Link from "next/link";
import { Button } from "@afenda/shadcn";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error with marketing context
    console.error("[Marketing Error]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: "marketing-pages",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground">
          We encountered an error while loading this page. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
