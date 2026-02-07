/**
 * Cache keys and TTLs.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeNumberEnum, makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Keys
 * --------------------------------------------- */
export const CACHE_KEYS = {
  HEALTH: "health",
  USER: "user",
  SESSION: "session",
  PERMISSIONS: "permissions",
  SETTINGS: "settings",
} as const;

export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS];

const CacheKeyEnum = makeStringEnum(CACHE_KEYS);

export const CACHE_KEY_LIST = CacheKeyEnum.list as readonly CacheKey[];
export const isCacheKey = CacheKeyEnum.is;

export function toCacheKey(value: unknown, fallback: CacheKey = CACHE_KEYS.HEALTH): CacheKey {
  return CacheKeyEnum.to(value, fallback) as CacheKey;
}

/** ---------------------------------------------
 * TTL (seconds)
 * --------------------------------------------- */
export const CACHE_TTL = {
  SHORT: 30,
  MEDIUM: 5 * 60,
  LONG: 60 * 60,
  DAY: 24 * 60 * 60,
} as const;

export type CacheTtlSeconds = (typeof CACHE_TTL)[keyof typeof CACHE_TTL];

const CacheTtlEnum = makeNumberEnum(CACHE_TTL);

export const CACHE_TTL_LIST = CacheTtlEnum.list as readonly CacheTtlSeconds[];
export const isCacheTtlSeconds = CacheTtlEnum.is;

export function toCacheTtlSeconds(
  value: unknown,
  fallback: CacheTtlSeconds = CACHE_TTL.MEDIUM
): CacheTtlSeconds {
  return CacheTtlEnum.to(value, fallback) as CacheTtlSeconds;
}
