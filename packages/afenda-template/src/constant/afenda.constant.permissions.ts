/**
 * Permission actions and resource names.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Actions
 * --------------------------------------------- */
export const PERMISSION_ACTIONS = {
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  ADMIN: "admin",
} as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];

const PermissionActionEnum = makeStringEnum(PERMISSION_ACTIONS);

export const PERMISSION_ACTION_LIST = PermissionActionEnum.list as readonly PermissionAction[];
export const isPermissionAction = PermissionActionEnum.is;

export function toPermissionAction(
  value: unknown,
  fallback: PermissionAction = PERMISSION_ACTIONS.READ
): PermissionAction {
  return PermissionActionEnum.to(value, fallback) as PermissionAction;
}

/** ---------------------------------------------
 * Resources
 * --------------------------------------------- */
export const PERMISSION_RESOURCES = {
  USER: "user",
  TEAM: "team",
  ORGANIZATION: "organization",
  PROJECT: "project",
  FILE: "file",
} as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[keyof typeof PERMISSION_RESOURCES];

const PermissionResourceEnum = makeStringEnum(PERMISSION_RESOURCES);

export const PERMISSION_RESOURCE_LIST = PermissionResourceEnum.list as readonly PermissionResource[];
export const isPermissionResource = PermissionResourceEnum.is;

export function toPermissionResource(
  value: unknown,
  fallback: PermissionResource = PERMISSION_RESOURCES.USER
): PermissionResource {
  return PermissionResourceEnum.to(value, fallback) as PermissionResource;
}
