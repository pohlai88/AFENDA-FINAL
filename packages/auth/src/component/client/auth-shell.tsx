"use client";

import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Shell wrapper for auth-related pages (login, register, loading).
 * Provides consistent layout and branding.
 */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center p-6">
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </div>
    </main>
  );
}
