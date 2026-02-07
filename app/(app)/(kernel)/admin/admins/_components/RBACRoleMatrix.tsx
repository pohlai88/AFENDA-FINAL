/**
 * Role Permissions Matrix - Server Wrapper
 * Fetches RBAC matrix data and determines edit permissions.
 *
 * @domain admin
 * @layer component
 */

import { getConfig, getAuthContext } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import { AdminAssignmentsSchema, DEFAULT_ADMIN_ASSIGNMENTS } from "@afenda/orchestra";
import { ADMIN_CONFIG_KEY, RBAC_CRUD_MATRIX } from "../_constants/admin-assignment.constants";
import { getUserRoles } from "../_utils/admin-assignment.utils";
import { RBACRoleMatrixClient } from "./RBACRoleMatrix.client";

export async function RBACRoleMatrix() {
  // Fetch current assignments to get user roles and stored matrix
  const result = await getConfig({ db }, ADMIN_CONFIG_KEY);
  const assignments =
    result.ok && result.data
      ? AdminAssignmentsSchema.safeParse(result.data.value)
      : { success: false as const };
  const data = assignments.success ? assignments.data : DEFAULT_ADMIN_ASSIGNMENTS;

  // Use stored matrix if available, otherwise use default
  const currentMatrix = data.rbacMatrix ?? RBAC_CRUD_MATRIX;

  // Check if current user can edit (full_admin or config_admin)
  const authContext = await getAuthContext();
  let canEdit = false;
  if (authContext.userId) {
    const userRoles = getUserRoles(authContext.userId, data);
    canEdit = userRoles.includes("full_admin") || userRoles.includes("config_admin");
  }

  return <RBACRoleMatrixClient initialMatrix={currentMatrix} canEdit={canEdit} />;
}
