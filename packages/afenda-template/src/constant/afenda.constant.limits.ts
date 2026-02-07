/**
 * Generic limits for validation and throughput.
 *
 * Note:
 * - These are scalar SSOT constants.
 * - We provide small helper validators for common constraints.
 */

import { clampInt } from "./afenda.core.helper";

export const LIMITS = {
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  MAX_SEARCH_LENGTH: 120,
  MAX_NAME_LENGTH: 120,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_UPLOAD_BYTES: 25 * 1024 * 1024,
} as const;

export type LimitKey = keyof typeof LIMITS;

export const RATE_LIMITS = {
  PER_MINUTE: 120,
  BURST: 30,
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;

/** Validate + normalize page size (commonly used for pagination). */
export function normalizePageSize(value: unknown, fallback: number = 20): number {
  return clampInt(value, LIMITS.MIN_PAGE_SIZE, LIMITS.MAX_PAGE_SIZE, fallback);
}

/** Validate + normalize page number (1-based). */
export function normalizePage(value: unknown, fallback: number = 1): number {
  return clampInt(value, 1, Number.MAX_SAFE_INTEGER, fallback);
}
