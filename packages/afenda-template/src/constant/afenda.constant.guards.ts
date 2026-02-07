/**
 * Runtime validators and helpers for constants.
 *
 * Scope rules:
 * - Keep this file side-effect free (no env access, no IO).
 * - Prefer enum-like guards to live next to their constants (e.g. `isHttpStatus` in `afenda.constant.http.ts`).
 * - Keep only cross-cutting validators and helper builders here.
 */

import { LIMITS } from "./afenda.constant.limits";
import { PASSWORD_RULES, VALIDATION_LIMITS } from "./afenda.constant.validation";
import { normalizePage, normalizePageSize } from "./afenda.constant.limits";

/** ---------------------------------------------
 * Validators (throwing, verbose errors)
 * --------------------------------------------- */

/**
 * Validator: Password meets all security rules.
 * Throws with a specific reason when invalid.
 */
export function validatePassword(password: string): string {
  if (password.length < VALIDATION_LIMITS.MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${VALIDATION_LIMITS.MIN_PASSWORD_LENGTH} characters`);
  }
  if (password.length > VALIDATION_LIMITS.MAX_PASSWORD_LENGTH) {
    throw new Error(`Password cannot exceed ${VALIDATION_LIMITS.MAX_PASSWORD_LENGTH} characters`);
  }

  if (PASSWORD_RULES.REQUIRE_UPPER && !/[A-Z]/.test(password)) {
    throw new Error("Password must contain at least one uppercase letter");
  }
  if (PASSWORD_RULES.REQUIRE_LOWER && !/[a-z]/.test(password)) {
    throw new Error("Password must contain at least one lowercase letter");
  }
  if (PASSWORD_RULES.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    throw new Error("Password must contain at least one number");
  }
  if (PASSWORD_RULES.REQUIRE_SYMBOL && !/[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]/.test(password)) {
    throw new Error("Password must contain at least one special character");
  }

  return password;
}

/** Validator: Name length is valid. */
export function validateName(name: string): string {
  if (name.length < VALIDATION_LIMITS.MIN_NAME_LENGTH) {
    throw new Error(`Name must be at least ${VALIDATION_LIMITS.MIN_NAME_LENGTH} characters`);
  }
  if (name.length > VALIDATION_LIMITS.MAX_NAME_LENGTH) {
    throw new Error(`Name cannot exceed ${VALIDATION_LIMITS.MAX_NAME_LENGTH} characters`);
  }
  return name;
}

/** Validator: Description length is valid. */
export function validateDescription(description: string): string {
  if (description.length > VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Description cannot exceed ${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH} characters`);
  }
  return description;
}

/**
 * Validator: Page size must be within limits.
 * Prefer `normalizePageSize` when you want clamping instead of throwing.
 */
export function validatePageSize(pageSize: number): number {
  const { MAX_PAGE_SIZE, MIN_PAGE_SIZE } = LIMITS;
  if (pageSize < MIN_PAGE_SIZE || pageSize > MAX_PAGE_SIZE) {
    throw new Error(`Page size must be between ${MIN_PAGE_SIZE} and ${MAX_PAGE_SIZE}, got ${pageSize}`);
  }
  return pageSize;
}

/** ---------------------------------------------
 * Builders (non-throwing)
 * --------------------------------------------- */

/**
 * Helper: Build pagination params with normalization.
 * - page: clamped to >= 1
 * - pageSize: clamped to [MIN_PAGE_SIZE..MAX_PAGE_SIZE]
 */
export function buildPaginationParams(
  page: unknown = 1,
  pageSize: unknown = 20,
  sortBy: string = "createdAt",
  sortDir: "asc" | "desc" = "desc"
) {
  return {
    page: normalizePage(page, 1),
    pageSize: normalizePageSize(pageSize, 20),
    sortBy,
    sortDir,
  } as const;
}

/**
 * Helper: Build query string from object.
 * - Filters null/undefined/empty-string
 * - Encodes keys + values safely
 */
export function buildQueryString(params: Record<string, string | number | boolean>): string {
  const entries = Object.entries(params)
    .filter(([_, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return entries.length > 0 ? `?${entries.join("&")}` : "";
}
