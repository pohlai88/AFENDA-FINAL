"use client";

/**
 * Admin Assignments Error Boundary
 * Enterprise-grade error handling with recovery options
 */

import { useEffect } from "react";
import { IconAlertTriangle, IconRefresh, IconHome } from "@tabler/icons-react";
import { Button, Alert, AlertDescription, AlertTitle } from "@afenda/shadcn";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { logger } from "@afenda/shared";

export default function AdminsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Admin Assignments Error", error, { component: "AdminsError", digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 lg:p-6">
      <Alert variant="destructive" className="max-w-2xl">
        <IconAlertTriangle className="size-5" />
        <AlertTitle className="text-lg font-semibold">
          Admin Assignments Error
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            We encountered an error while loading the admin assignments page.
            This has been logged and our team will investigate.
          </p>
          {error.digest && (
            <p className="text-xs font-mono">Error ID: {error.digest}</p>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          <IconRefresh className="mr-2 size-4" />
          Try Again
        </Button>
        <Button asChild variant="outline">
          <Link href={routes.ui.admin.root()}>
            <IconHome className="mr-2 size-4" />
            Back to Admin
          </Link>
        </Button>
      </div>

      {process.env.NODE_ENV === "development" && (
        <details className="max-w-2xl w-full">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Developer Details
          </summary>
          <pre className="mt-2 rounded-lg bg-muted p-4 text-xs overflow-auto">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
