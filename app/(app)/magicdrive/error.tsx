/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive error boundary - enterprise a11y and production-ready
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface MagicdriveErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MagicdriveError({ error, reset }: MagicdriveErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- error boundary dev logging
      console.error("[MagicDrive] Error boundary:", error);
    }
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4"
      role="alert"
      aria-live="assertive"
      aria-labelledby="magicdrive-error-title"
      aria-describedby="magicdrive-error-desc"
    >
      <div className="flex items-center gap-2 text-destructive" aria-hidden>
        <AlertTriangle className="h-6 w-6 shrink-0" />
        <h2 id="magicdrive-error-title" className="text-xl font-semibold">
          Something went wrong
        </h2>
      </div>
      <p
        id="magicdrive-error-desc"
        className="text-muted-foreground text-center max-w-md"
      >
        We encountered an error while loading MagicDrive. Please try again.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          onClick={reset}
          variant="outline"
          aria-label="Try loading MagicDrive again"
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          Try again
        </Button>
        <Button variant="ghost" asChild aria-label="Go to dashboard">
          <Link href={routes.ui.orchestra.dashboard()}>
            <Home className="mr-2 h-4 w-4" aria-hidden />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
