"use client";

/**
 * User context for app shell and route UI. Uses Neon Auth session.
 *
 * @layer app/components
 */

import * as React from "react";
import { authClient } from "@afenda/auth/client";

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

export interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { data: session, isPending } = authClient.useSession();

  const user = React.useMemo<User | null>(() => {
    const u = session?.user;
    if (!u) return null;
    return {
      id: u.id,
      email: (u.email as string) ?? "",
      name: (u.name as string) ?? u.email ?? "User",
      avatar: (u.image as string) ?? undefined,
      role: "user" as const,
    };
  }, [session?.user]);

  const value = React.useMemo<UserContextValue>(
    () => ({
      user,
      isLoading: isPending,
      isAuthenticated: !!user,
    }),
    [user, isPending]
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
