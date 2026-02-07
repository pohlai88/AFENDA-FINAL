"use client";

import { useEffect, useState } from "react";
import { AuthView } from "@neondatabase/auth/react/ui";

/**
 * Renders AuthView only after mount to avoid hydration mismatch.
 * Neon Auth UI forms use React.useId() for field ids; when the server and client
 * render in different order (e.g. with streaming), those ids can differ and cause
 * "attributes of the server rendered HTML didn't match the client" errors.
 * Deferring the form to client-only fixes this.
 */
export function AuthViewClient({ path }: { path: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="grid w-full max-w-sm gap-3"
        aria-hidden
        style={{ minHeight: "20rem" }}
      >
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-2">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return <AuthView path={path} />;
}
