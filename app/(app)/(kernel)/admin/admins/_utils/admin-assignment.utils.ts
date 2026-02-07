/**
 * Pure helpers for admin assignments (no "use server").
 * Kept separate so they can be used from Server Components without being server actions.
 */

import type { AdminAssignments, PrimaryAdminEntry, AdminRole } from "@afenda/orchestra";

export function getEffectivePrimaryAdmin(a: AdminAssignments): PrimaryAdminEntry | null {
  if (a.primaryAdmin) return a.primaryAdmin;
  const uid = a.primaryAdminUserId;
  if (!uid) return null;
  return { userId: uid };
}

/**
 * Get the roles assigned to a user based on admin assignments.
 * Returns full_admin if the user is the primary admin, or the delegated roles otherwise.
 */
export function getUserRoles(userId: string, assignments: AdminAssignments): AdminRole[] {
  const primaryAdmin = getEffectivePrimaryAdmin(assignments);
  if (primaryAdmin?.userId === userId) {
    return ["full_admin"];
  }

  const delegated = assignments.delegatedAdmins.find((d) => d.userId === userId);
  return delegated?.roles ?? [];
}
