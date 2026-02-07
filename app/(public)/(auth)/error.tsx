"use client";

/**
 * Auth error boundary — sign-in, sign-up, forgot-password, reset, OAuth.
 * Follows Neon Auth best practice: clear message, try again, back to sign-in.
 * @see https://neon.com/docs/auth/guides/password-reset
 */

import { useEffect } from "react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { AlertCircle } from "lucide-react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Auth error:", error);
    }
  }, [error]);

  return (
    <main className="container mx-auto flex min-h-svh flex-col items-center justify-center gap-6 p-4 md:p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border bg-card p-6 text-center shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We couldn’t complete sign in, sign up, or password reset. Please try
            again or use the links below.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href={routes.ui.auth.login()}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Back to sign in
          </Link>
          <Link
            href={routes.ui.auth.forgotPassword()}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}
