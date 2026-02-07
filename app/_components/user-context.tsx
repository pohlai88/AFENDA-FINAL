"use client";

/**
 * User context for app shell and route UI. Provides session user and loading state.
 * Replace MOCK_USER with real auth (e.g. session from auth package) when integrated.
 *
 * @layer app/components
 */

import * as React from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "user" | "viewer";
}

export interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = React.createContext<UserContextValue | null>(null);

/** Placeholder until auth package is wired. Replace with session from server/auth. */
const MOCK_USER: User = {
  id: "user_dev_001",
  email: "admin@afenda.dev",
  name: "Admin User",
  role: "admin",
};

export interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user] = React.useState<User | null>(MOCK_USER);
  const [isLoading] = React.useState(false);

  const value = React.useMemo<UserContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
    }),
    [user, isLoading]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const context = React.useContext(UserContext);
  if (context == null) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

/** User initials for avatar fallback (e.g. "John Doe" → "JD"). */
export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
