/**
 * Orchestra Kernel Admin Assignments Schema
 * RBAC and admin user assignment structures.
 *
 * @layer zod
 * @domain orchestra
 */

import { z } from "zod";

/** Admin role identifiers (kernel-scoped) */
export const ADMIN_ROLE_VALUES = [
  "full_admin",
  "config_admin",
  "audit_viewer",
  "backup_admin",
  "health_viewer",
  "service_admin",
] as const;

export const AdminRoleSchema = z.enum(ADMIN_ROLE_VALUES);
export type AdminRole = z.infer<typeof AdminRoleSchema>;

/** Primary admin entry (user ID + optional contact metadata) */
export const PrimaryAdminEntrySchema = z.object({
  userId: z.string().min(1).max(256),
  displayName: z.string().max(256).optional(),
  email: z.string().max(256).optional(),
  contact: z.string().max(256).optional(),
});

export type PrimaryAdminEntry = z.infer<typeof PrimaryAdminEntrySchema>;

/** Delegated admin entry */
export const DelegatedAdminSchema = z.object({
  userId: z.string().min(1).max(256),
  displayName: z.string().max(256).optional(),
  email: z.string().max(256).optional(),
  contact: z.string().max(256).optional(),
  roles: z.array(AdminRoleSchema).min(1).max(10),
  addedAt: z.string().datetime(),
});

export type DelegatedAdmin = z.infer<typeof DelegatedAdminSchema>;

/** Admin assignments config value (stored in orchestra_admin_config) */
export const AdminAssignmentsSchema = z.object({
  /** @deprecated Use primaryAdmin instead */
  primaryAdminUserId: z.string().max(256).nullable().optional(),
  /** Primary admin with full metadata */
  primaryAdmin: PrimaryAdminEntrySchema.nullable().optional(),
  delegatedAdmins: z.array(DelegatedAdminSchema).default([]),
  /** RBAC permission matrix for admin roles */
  rbacMatrix: z.record(z.record(z.record(z.boolean()))).optional(),
});

export type AdminAssignments = z.infer<typeof AdminAssignmentsSchema>;

/** Default empty assignments */
export const DEFAULT_ADMIN_ASSIGNMENTS: AdminAssignments = {
  primaryAdminUserId: null,
  delegatedAdmins: [],
  rbacMatrix: undefined,
};
