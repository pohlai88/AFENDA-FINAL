"use server";

/**
 * Admin Assignment Server Actions
 * Mutations for primary admin and delegated admins with Zod validation and auth.
 */

import { revalidatePath, refresh } from "next/cache";
import { getConfig, setConfig, getAuthContext } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import { routes } from "@afenda/shared/constants";
import {
  AdminAssignmentsSchema,
  DEFAULT_ADMIN_ASSIGNMENTS,
  ADMIN_ROLE_VALUES,
  type AdminAssignments,
  type AdminRole,
  type PrimaryAdminEntry,
} from "@afenda/orchestra";
import { getUserRoles } from "../_utils/admin-assignment.utils";
import { z } from "zod";
import { ADMIN_CONFIG_KEY } from "../_constants/admin-assignment.constants";

export type ActionState = {
  success?: boolean;
  error?: string;
  errors?: Record<string, string[]>;
};

async function getAssignments(): Promise<AdminAssignments> {
  const result = await getConfig({ db }, ADMIN_CONFIG_KEY);
  if (!result.ok || !result.data) {
    return DEFAULT_ADMIN_ASSIGNMENTS;
  }
  const parsed = AdminAssignmentsSchema.safeParse(result.data.value);
  if (!parsed.success) {
    return DEFAULT_ADMIN_ASSIGNMENTS;
  }
  return parsed.data;
}

function getEffectivePrimaryUserId(a: AdminAssignments): string | null {
  if (a.primaryAdmin?.userId) return a.primaryAdmin.userId;
  return a.primaryAdminUserId ?? null;
}

async function ensureAuthorized(): Promise<{ authorized: boolean; error?: string }> {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return { authorized: false, error: "You must be logged in to perform this action." };
  }
  const assignments = await getAssignments();
  const primaryUserId = getEffectivePrimaryUserId(assignments);
  if (!primaryUserId) {
    return { authorized: true };
  }
  const isPrimary = primaryUserId === ctx.userId;
  const delegated = assignments.delegatedAdmins.find((d) => d.userId === ctx.userId);
  const hasFullAdmin = delegated?.roles.includes("full_admin") ?? false;
  if (!isPrimary && !hasFullAdmin) {
    return { authorized: false, error: "Only the primary administrator or a full admin can perform this action." };
  }
  return { authorized: true };
}

/** Accepts (formData) for plain form, or (prevState, formData) for useActionState */
export async function setPrimaryAdminAction(
  prevOrForm: ActionState | FormData,
  formDataArg?: FormData
): Promise<ActionState> {
  const formData = formDataArg ?? (prevOrForm as FormData);
  const auth = await ensureAuthorized();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const userId = formData?.get("userId") as string | null;
  const displayName = (formData?.get("displayName") as string | null)?.trim() || undefined;
  const email = (formData?.get("email") as string | null)?.trim() || undefined;
  const contact = (formData?.get("contact") as string | null)?.trim() || undefined;
  const schema = z.object({
    userId: z.string().min(1, "User ID or email is required").max(256),
  });
  const parsed = schema.safeParse({ userId: userId ?? "" });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, errors };
  }

  const primaryAdmin: PrimaryAdminEntry = {
    userId: parsed.data.userId,
    displayName: displayName || undefined,
    email: email || undefined,
    contact: contact || undefined,
  };

  const assignments = await getAssignments();
  const updated: AdminAssignments = {
    ...assignments,
    primaryAdminUserId: parsed.data.userId,
    primaryAdmin,
  };

  const result = await setConfig(
    { db },
    {
      key: ADMIN_CONFIG_KEY,
      value: updated,
      description: "Admin assignments (primary + delegated)",
    },
    { actorId: (await getAuthContext()).userId ?? undefined }
  );

  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath(routes.ui.admin.admins());
  refresh();
  return { success: true };
}

const adminRoleEnum = z.enum(ADMIN_ROLE_VALUES);
const addDelegatedAdminSchema = z.object({
  userId: z.string().min(1, "User ID or email is required").max(256),
  displayName: z.string().max(256).optional(),
  email: z.string().max(256).optional(),
  contact: z.string().max(256).optional(),
  roles: z.array(adminRoleEnum).min(1, "At least one role is required").max(10),
});

export async function addDelegatedAdminAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await ensureAuthorized();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const userId = formData.get("userId") as string | null;
  const displayName = (formData.get("displayName") as string | null)?.trim() || undefined;
  const email = (formData.get("email") as string | null)?.trim() || undefined;
  const contact = (formData.get("contact") as string | null)?.trim() || undefined;
  const rolesRaw = formData.getAll("roles");
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : [];

  const parsed = addDelegatedAdminSchema.safeParse({
    userId: userId ?? "",
    displayName,
    email,
    contact,
    roles,
  });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, errors };
  }

  const assignments = await getAssignments();
  if (assignments.delegatedAdmins.some((d) => d.userId === parsed.data!.userId)) {
    return { success: false, error: "User is already a delegated admin." };
  }

  const newDelegate = {
    userId: parsed.data!.userId,
    displayName: parsed.data!.displayName,
    email: parsed.data!.email,
    contact: parsed.data!.contact,
    roles: parsed.data!.roles as AdminRole[],
    addedAt: new Date().toISOString(),
  };

  const updated: AdminAssignments = {
    ...assignments,
    delegatedAdmins: [...assignments.delegatedAdmins, newDelegate],
  };

  const result = await setConfig(
    { db },
    {
      key: ADMIN_CONFIG_KEY,
      value: updated,
      description: "Admin assignments (primary + delegated)",
    },
    { actorId: (await getAuthContext()).userId ?? undefined }
  );

  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath(routes.ui.admin.admins());
  refresh();
  return { success: true };
}

export async function updateDelegatedAdminRolesAction(
  userId: string,
  roles: AdminRole[]
): Promise<ActionState> {
  const auth = await ensureAuthorized();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const rolesSchema = z.array(z.enum(ADMIN_ROLE_VALUES)).min(1).max(10);
  const parsed = rolesSchema.safeParse(roles);
  if (!parsed.success) {
    return { success: false, error: "Invalid roles." };
  }

  const assignments = await getAssignments();
  const idx = assignments.delegatedAdmins.findIndex((d) => d.userId === userId);
  if (idx === -1) {
    return { success: false, error: "Delegated admin not found." };
  }

  const validRoles = parsed.data as AdminRole[];
  const updatedAdmins = [...assignments.delegatedAdmins];
  updatedAdmins[idx] = { ...updatedAdmins[idx]!, roles: validRoles };

  const updated: AdminAssignments = {
    ...assignments,
    delegatedAdmins: updatedAdmins,
  };

  const result = await setConfig(
    { db },
    {
      key: ADMIN_CONFIG_KEY,
      value: updated,
      description: "Admin assignments (primary + delegated)",
    },
    { actorId: (await getAuthContext()).userId ?? undefined }
  );

  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath(routes.ui.admin.admins());
  refresh();
  return { success: true };
}

export async function removeDelegatedAdminAction(userId: string): Promise<ActionState> {
  const auth = await ensureAuthorized();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const assignments = await getAssignments();
  const filtered = assignments.delegatedAdmins.filter((d) => d.userId !== userId);
  if (filtered.length === assignments.delegatedAdmins.length) {
    return { success: false, error: "Delegated admin not found." };
  }

  const updated: AdminAssignments = {
    ...assignments,
    delegatedAdmins: filtered,
  };

  const result = await setConfig(
    { db },
    {
      key: ADMIN_CONFIG_KEY,
      value: updated,
      description: "Admin assignments (primary + delegated)",
    },
    { actorId: (await getAuthContext()).userId ?? undefined }
  );

  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath(routes.ui.admin.admins());
  refresh();
  return { success: true };
}

export async function updateRBACMatrixAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Allow both full_admin and config_admin to update RBAC matrix
  const authContext = await getAuthContext();
  if (!authContext.userId) {
    return { success: false, error: "Not authenticated" };
  }

  const assignments = await getAssignments();
  const userRoles = getUserRoles(authContext.userId, assignments);
  const canEdit = userRoles.includes("full_admin") || userRoles.includes("config_admin");

  if (!canEdit) {
    return {
      success: false,
      error: "Only Full Admin and Config Admin can update role permissions",
    };
  }

  const matrixJson = formData.get("matrix") as string | null;
  if (!matrixJson) {
    return { success: false, error: "No matrix data provided" };
  }

  let parsedMatrix: unknown;
  try {
    parsedMatrix = JSON.parse(matrixJson);
  } catch {
    return { success: false, error: "Invalid matrix JSON" };
  }

  // Validate the matrix structure
  if (typeof parsedMatrix !== "object" || !parsedMatrix) {
    return { success: false, error: "Invalid matrix structure" };
  }

  const matrix = parsedMatrix as Record<string, unknown>;
  const validRoles = ADMIN_ROLE_VALUES;
  const validResources = ["user_management", "content_moderation", "analytics", "billing", "settings", "system"];
  const validOps = ["create", "read", "update", "delete"];

  for (const role of validRoles) {
    if (!(role in matrix) || typeof matrix[role] !== "object" || !matrix[role]) {
      return { success: false, error: `Invalid matrix: missing or invalid role ${role}` };
    }
    const resources = matrix[role] as Record<string, unknown>;
    for (const resource of validResources) {
      if (!(resource in resources) || typeof resources[resource] !== "object" || !resources[resource]) {
        return { success: false, error: `Invalid matrix: missing or invalid resource ${resource} for role ${role}` };
      }
      const ops = resources[resource] as Record<string, unknown>;
      for (const op of validOps) {
        if (!(op in ops) || typeof ops[op] !== "boolean") {
          return { success: false, error: `Invalid matrix: missing or invalid operation ${op} for ${role}.${resource}` };
        }
      }
    }
  }

  const updated: AdminAssignments = {
    ...assignments,
    rbacMatrix: parsedMatrix as AdminAssignments["rbacMatrix"],
  };

  const result = await setConfig(
    { db },
    {
      key: ADMIN_CONFIG_KEY,
      value: updated,
      description: "Admin assignments (primary + delegated)",
    },
    { actorId: authContext.userId }
  );

  if (!result.ok) {
    return { success: false, error: result.error.message };
  }

  revalidatePath(routes.ui.admin.admins());
  refresh();
  return { success: true };
}
