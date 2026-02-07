/**
 * Generic defaults used across the application.
 *
 * Note:
 * - This file is about SSOT defaults (values), not enums.
 * - We expose key unions + runtime key guard to avoid typos.
 */

import { isString } from "./afenda.core.helper";

export const DEFAULTS = {
  LOCALE: "en-US",
  TIME_ZONE: "UTC",
  CURRENCY: "USD",
  PAGE_SIZE: 20,
  SORT_DIRECTION: "desc",
} as const;

export type DefaultKey = keyof typeof DEFAULTS;

export const DEFAULT_KEY_LIST = Object.keys(DEFAULTS) as readonly DefaultKey[];

export function isDefaultKey(value: unknown): value is DefaultKey {
  return isString(value) && (DEFAULT_KEY_LIST as readonly string[]).includes(value);
}

/** Safe getter for defaults (supports unknown/unsafe key input). */
export function getDefault<TFallback = unknown>(key: unknown, fallback?: TFallback) {
  if (!isDefaultKey(key)) return fallback;
  return DEFAULTS[key] as (typeof DEFAULTS)[DefaultKey];
}
