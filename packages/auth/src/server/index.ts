/**
 * Server-side auth utilities.
 * Neon Auth instance and session-derived auth context.
 */

export { auth } from "./neon-auth.server";
export {
  getAuthContext,
  getCurrentUserId,
  getCurrentUserName,
  isAuthenticated,
  type AuthContext,
} from "./auth-context.server";
