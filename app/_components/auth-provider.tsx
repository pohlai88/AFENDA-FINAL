"use client";

import type { ReactNode } from "react";

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth context provider. Wraps the app with authentication context for session management.
 * Placeholder: session state, login/logout/refresh, and user data to be wired to auth package.
 *
 * @layer app/components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}
