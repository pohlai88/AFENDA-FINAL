/**
 * Auth context from Neon Auth session.
 * Maps session to AuthContext for orchestra compatibility.
 *
 * @layer auth/server
 */

import "server-only";
import { auth } from "./neon-auth.server";

/**
 * Auth context extracted from session (matches orchestra contract)
 */
export interface AuthContext {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  actorType: "user" | "system" | "service";
}

/**
 * Get auth context from current Neon Auth session.
 */
export async function getAuthContext(): Promise<AuthContext> {
  try {
    const { data: session } = await auth.getSession();

    if (!session?.user) {
      return {
        userId: null,
        userName: null,
        userEmail: null,
        actorType: "system",
      };
    }

    const user = session.user;
    return {
      userId: user.id ?? null,
      userName: (user.name as string) ?? user.email ?? "Unknown User",
      userEmail: (user.email as string) ?? null,
      actorType: "user",
    };
  } catch {
    return {
      userId: null,
      userName: null,
      userEmail: null,
      actorType: "system",
    };
  }
}

/**
 * Get user ID from current session.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const context = await getAuthContext();
  return context.userId;
}

/**
 * Get user display name from current session.
 */
export async function getCurrentUserName(): Promise<string | null> {
  const context = await getAuthContext();
  return context.userName;
}

/**
 * Check if current request is from authenticated user.
 */
export async function isAuthenticated(): Promise<boolean> {
  const context = await getAuthContext();
  return context.actorType === "user" && context.userId !== null;
}
