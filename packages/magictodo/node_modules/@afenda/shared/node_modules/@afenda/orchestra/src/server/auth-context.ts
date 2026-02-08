/**
 * Auth Context Helper
 * Re-exports from @afenda/auth (Neon Auth session).
 * Used by orchestra consumers for audit logging and tracking.
 *
 * @layer server
 * @domain orchestra
 */

import "server-only";

export {
  getAuthContext,
  getCurrentUserId,
  getCurrentUserName,
  isAuthenticated,
  type AuthContext,
} from "@afenda/auth/server";
