/**
 * Server-side auth utilities.
 * Re-exports from orchestra kernel for consistent auth context access.
 */

export {
  getAuthContext,
  getCurrentUserId,
  getCurrentUserName,
  isAuthenticated,
  type AuthContext,
} from "@afenda/orchestra/server";
