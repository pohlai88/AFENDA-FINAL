/**
 * Normalized error codes and categories.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Codes
 * --------------------------------------------- */
export const ERROR_CODES = {
  UNKNOWN: "UNKNOWN",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const ErrorCodeEnum = makeStringEnum(ERROR_CODES);

export const ERROR_CODE_LIST = ErrorCodeEnum.list as readonly ErrorCode[];
export const isErrorCode = ErrorCodeEnum.is;

export function toErrorCode(value: unknown, fallback: ErrorCode = ERROR_CODES.UNKNOWN): ErrorCode {
  return ErrorCodeEnum.to(value, fallback) as ErrorCode;
}

/** ---------------------------------------------
 * Categories
 * --------------------------------------------- */
export const ERROR_CATEGORIES = {
  CLIENT: "client",
  SERVER: "server",
  NETWORK: "network",
  AUTH: "auth",
  DATA: "data",
} as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[keyof typeof ERROR_CATEGORIES];

const ErrorCategoryEnum = makeStringEnum(ERROR_CATEGORIES);

export const ERROR_CATEGORY_LIST = ErrorCategoryEnum.list as readonly ErrorCategory[];
export const isErrorCategory = ErrorCategoryEnum.is;

export function toErrorCategory(
  value: unknown,
  fallback: ErrorCategory = ERROR_CATEGORIES.CLIENT
): ErrorCategory {
  return ErrorCategoryEnum.to(value, fallback) as ErrorCategory;
}
