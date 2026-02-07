/**
 * Admin Assignment Constants
 * RBAC roles, CRUD permission matrix, and config key.
 *
 * @domain admin
 * @layer constants
 */

import type { AdminRole } from "@afenda/orchestra";

export const ADMIN_CONFIG_KEY = "admin.assignments" as const;

/** Admin roles (kernel-scoped) */
export const ADMIN_ROLES: readonly AdminRole[] = [
  "full_admin",
  "config_admin",
  "audit_viewer",
  "backup_admin",
  "health_viewer",
  "service_admin",
] as const;

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  full_admin: "Full Admin",
  config_admin: "Config Admin",
  audit_viewer: "Audit Viewer",
  backup_admin: "Backup Admin",
  health_viewer: "Health Viewer",
  service_admin: "Service Admin",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  full_admin: "Full administrative access to all resources",
  config_admin: "Manage system configuration",
  audit_viewer: "View audit logs and activity",
  backup_admin: "Create and restore backups",
  health_viewer: "View system health and status",
  service_admin: "Manage service registry and deployments",
};

/** Enterprise resources (admin kernel scope) */
export const RBAC_RESOURCES = [
  "config",
  "audit",
  "backup",
  "health",
  "service_registry",
  "admin_assignments",
] as const;

export type RbacResource = (typeof RBAC_RESOURCES)[number];

export const RBAC_RESOURCE_LABELS: Record<RbacResource, string> = {
  config: "Configuration",
  audit: "Audit Logs",
  backup: "Backups",
  health: "Health & Status",
  service_registry: "Service Registry",
  admin_assignments: "Admin Assignments",
};

/** CRUD operations */
export const CRUD_OPS = ["create", "read", "update", "delete"] as const;

export type CrudOp = (typeof CRUD_OPS)[number];

export const CRUD_LABELS: Record<CrudOp, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
};

/**
 * Enterprise RBAC matrix: Role → Resource → CRUD
 * ✓ = granted, — = not granted
 */
export const RBAC_CRUD_MATRIX: Record<AdminRole, Record<RbacResource, Record<CrudOp, boolean>>> = {
  full_admin: {
    config: { create: true, read: true, update: true, delete: true },
    audit: { create: false, read: true, update: false, delete: false },
    backup: { create: true, read: true, update: true, delete: true },
    health: { create: false, read: true, update: false, delete: false },
    service_registry: { create: true, read: true, update: true, delete: true },
    admin_assignments: { create: true, read: true, update: true, delete: true },
  },
  config_admin: {
    config: { create: true, read: true, update: true, delete: true },
    audit: { create: false, read: false, update: false, delete: false },
    backup: { create: false, read: false, update: false, delete: false },
    health: { create: false, read: false, update: false, delete: false },
    service_registry: { create: false, read: false, update: false, delete: false },
    admin_assignments: { create: false, read: false, update: false, delete: false },
  },
  audit_viewer: {
    config: { create: false, read: false, update: false, delete: false },
    audit: { create: false, read: true, update: false, delete: false },
    backup: { create: false, read: false, update: false, delete: false },
    health: { create: false, read: false, update: false, delete: false },
    service_registry: { create: false, read: false, update: false, delete: false },
    admin_assignments: { create: false, read: false, update: false, delete: false },
  },
  backup_admin: {
    config: { create: false, read: false, update: false, delete: false },
    audit: { create: false, read: false, update: false, delete: false },
    backup: { create: true, read: true, update: true, delete: true },
    health: { create: false, read: true, update: false, delete: false },
    service_registry: { create: false, read: false, update: false, delete: false },
    admin_assignments: { create: false, read: false, update: false, delete: false },
  },
  health_viewer: {
    config: { create: false, read: false, update: false, delete: false },
    audit: { create: false, read: false, update: false, delete: false },
    backup: { create: false, read: false, update: false, delete: false },
    health: { create: false, read: true, update: false, delete: false },
    service_registry: { create: false, read: false, update: false, delete: false },
    admin_assignments: { create: false, read: false, update: false, delete: false },
  },
  service_admin: {
    config: { create: false, read: false, update: false, delete: false },
    audit: { create: false, read: false, update: false, delete: false },
    backup: { create: false, read: false, update: false, delete: false },
    health: { create: false, read: true, update: false, delete: false },
    service_registry: { create: true, read: true, update: true, delete: true },
    admin_assignments: { create: false, read: false, update: false, delete: false },
  },
};
