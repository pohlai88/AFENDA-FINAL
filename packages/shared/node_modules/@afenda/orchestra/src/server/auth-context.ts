/**
 * Auth Context Helper
 * Extracts user context from auth session for audit logging and tracking.
 * 
 * @layer server
 * @domain orchestra
 */

import "server-only";
import { headers } from "next/headers";
import { kernelLogger } from "../constant/orchestra.logger";

/**
 * Auth context extracted from session
 */
export interface AuthContext {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  actorType: "user" | "system" | "service";
}

/**
 * Get auth context from current session
 * Returns user information if authenticated, otherwise system context
 * 
 * TODO: Integrate with @afenda/auth package when server exports are available
 * For now, uses mock user from development context
 */
export async function getAuthContext(): Promise<AuthContext> {
  try {
    // Check for user ID in headers (set by middleware or auth layer)
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userName = headersList.get("x-user-name");
    const userEmail = headersList.get("x-user-email");

    if (userId) {
      return {
        userId,
        userName: userName ?? "Unknown User",
        userEmail: userEmail ?? null,
        actorType: "user",
      };
    }

    // Fallback: Use mock user for development
    // TODO: Remove this when real auth is integrated
    const isDevelopment = process.env.NODE_ENV === "development";
    if (isDevelopment) {
      return {
        userId: "user_dev_001",
        userName: "Admin User",
        userEmail: "admin@afenda.dev",
        actorType: "user",
      };
    }

    // No session - system context
    return {
      userId: null,
      userName: null,
      userEmail: null,
      actorType: "system",
    };
  } catch (error) {
    // Error getting context - fallback to system
    kernelLogger.warn("auth-context", "Failed to get auth context", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      userId: null,
      userName: null,
      userEmail: null,
      actorType: "system",
    };
  }
}

/**
 * Get user ID from current session (convenience method)
 */
export async function getCurrentUserId(): Promise<string | null> {
  const context = await getAuthContext();
  return context.userId;
}

/**
 * Get user display name from current session (convenience method)
 */
export async function getCurrentUserName(): Promise<string | null> {
  const context = await getAuthContext();
  return context.userName;
}

/**
 * Check if current request is from authenticated user
 */
export async function isAuthenticated(): Promise<boolean> {
  const context = await getAuthContext();
  return context.actorType === "user" && context.userId !== null;
}
