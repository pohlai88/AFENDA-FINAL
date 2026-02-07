import { z } from "zod";

import { LIMITS, PAGINATION_DEFAULTS } from "../constant";

/**
 * Numeric coercion is a big Zod superpower.
 * This module standardizes it.
 */

export const zIntCoerce = z.coerce.number().int();
export const zFloatCoerce = z.coerce.number();

export function zClampedInt(min: number, max: number, fallback: number) {
  return z.preprocess((v) => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    const i = Math.trunc(n);
    if (i < min) return min;
    if (i > max) return max;
    return i;
  }, z.number().int().min(min).max(max));
}

const MAX_PAGE = 1_000_000;

export const zPage = zClampedInt(1, MAX_PAGE, PAGINATION_DEFAULTS.PAGE);
export const zPageSize = zClampedInt(
  LIMITS.MIN_PAGE_SIZE,
  LIMITS.MAX_PAGE_SIZE,
  PAGINATION_DEFAULTS.PAGE_SIZE
);

export const zMoney = z.preprocess((v) => {
  // allow "12.34", 12.34
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  // normalize to 2dp in output
  return Math.round(n * 100) / 100;
}, z.number().min(0));
