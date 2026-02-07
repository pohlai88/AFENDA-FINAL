/**
 * Feature flag defaults (boolean toggles).
 *
 * Note:
 * - Values are booleans (not enum-like).
 * - We provide key unions + runtime key guard for safety.
 */

import { isString } from "./afenda.core.helper";

export const FEATURE_FLAGS = {
  BETA_UI: false,
  ENABLE_PWA: true,
  ENABLE_ANALYTICS: true,
  ENABLE_DEVTOOLS: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const FEATURE_FLAG_KEY_LIST = Object.keys(FEATURE_FLAGS) as readonly FeatureFlagKey[];

export function isFeatureFlagKey(value: unknown): value is FeatureFlagKey {
  return isString(value) && (FEATURE_FLAG_KEY_LIST as readonly string[]).includes(value);
}

/** Read a flag with fallback (supports unknown/unsafe key input). */
export function getFeatureFlag(key: unknown, fallback = false): boolean {
  return isFeatureFlagKey(key) ? Boolean(FEATURE_FLAGS[key]) : fallback;
}
