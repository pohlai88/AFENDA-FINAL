/**
 * Auth 404 — unknown auth route; link back to sign-in.
 * Keeps auth flows within the same UX pattern.
 */

import Link from "next/link";
import { routes } from "@afenda/shared/constants";

export default function AuthNotFound() {
  return (
    <main className="container mx-auto flex min-h-svh flex-col items-center justify-center gap-6 p-4 md:p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This sign-in or account page doesn’t exist. Go back to sign in or
          create an account.
        </p>
        <div className="flex w-full flex-col gap-3 pt-2">
          <Link
            href={routes.ui.auth.login()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Sign in
          </Link>
          <Link
            href={routes.ui.auth.register()}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
