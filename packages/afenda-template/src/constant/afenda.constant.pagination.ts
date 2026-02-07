/**
 * Pagination defaults and query parameter keys.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { clampInt, makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Defaults
 * --------------------------------------------- */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 20,
  SORT_BY: "createdAt",
  SORT_DIRECTION: "desc",
} as const;

export type PaginationDefaults = Readonly<typeof PAGINATION_DEFAULTS>;

/** ---------------------------------------------
 * Query keys
 * --------------------------------------------- */
export const PAGINATION_QUERY_KEYS = {
  PAGE: "page",
  PAGE_SIZE: "pageSize",
  SORT_BY: "sortBy",
  SORT_DIRECTION: "sortDir",
  CURSOR: "cursor",
} as const;

export type PaginationQueryKey = (typeof PAGINATION_QUERY_KEYS)[keyof typeof PAGINATION_QUERY_KEYS];

const PaginationQueryKeyEnum = makeStringEnum(PAGINATION_QUERY_KEYS);

export const PAGINATION_QUERY_KEY_LIST = PaginationQueryKeyEnum.list as readonly PaginationQueryKey[];
export const isPaginationQueryKey = PaginationQueryKeyEnum.is;

export function toPaginationQueryKey(
  value: unknown,
  fallback: PaginationQueryKey = PAGINATION_QUERY_KEYS.PAGE
): PaginationQueryKey {
  return PaginationQueryKeyEnum.to(value, fallback) as PaginationQueryKey;
}

/**
 * Normalize page/pageSize with clamping.
 * - Pass in unknown values (query params) safely.
 */
export function normalizePagination(input?: {
  page?: unknown;
  pageSize?: unknown;
  sortBy?: unknown;
  sortDir?: unknown;
}) {
  const page = clampInt(input?.page, 1, Number.MAX_SAFE_INTEGER, PAGINATION_DEFAULTS.PAGE);
  const pageSize = clampInt(input?.pageSize, 1, Number.MAX_SAFE_INTEGER, PAGINATION_DEFAULTS.PAGE_SIZE);

  const sortBy = typeof input?.sortBy === "string" && input.sortBy.trim() ? input.sortBy : PAGINATION_DEFAULTS.SORT_BY;

  const sortDir =
    input?.sortDir === "asc" || input?.sortDir === "desc" ? input.sortDir : PAGINATION_DEFAULTS.SORT_DIRECTION;

  return { page, pageSize, sortBy, sortDir } as const;
}
