/**
 * Generic status values for entities and requests.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Entity status
 * --------------------------------------------- */
export const ENTITY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export type EntityStatus = (typeof ENTITY_STATUS)[keyof typeof ENTITY_STATUS];

const EntityStatusEnum = makeStringEnum(ENTITY_STATUS);

export const ENTITY_STATUS_LIST = EntityStatusEnum.list as readonly EntityStatus[];
export const isEntityStatus = EntityStatusEnum.is;

export function toEntityStatus(value: unknown, fallback: EntityStatus = ENTITY_STATUS.ACTIVE): EntityStatus {
  return EntityStatusEnum.to(value, fallback) as EntityStatus;
}

/** ---------------------------------------------
 * Request status
 * --------------------------------------------- */
export const REQUEST_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

const RequestStatusEnum = makeStringEnum(REQUEST_STATUS);

export const REQUEST_STATUS_LIST = RequestStatusEnum.list as readonly RequestStatus[];
export const isRequestStatus = RequestStatusEnum.is;

export function toRequestStatus(
  value: unknown,
  fallback: RequestStatus = REQUEST_STATUS.IDLE
): RequestStatus {
  return RequestStatusEnum.to(value, fallback) as RequestStatus;
}
