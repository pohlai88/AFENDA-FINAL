import { z } from "zod";

/**
 * Date/time handling: normalize input and make output consistent.
 * Decide your “canonical runtime type”:
 * - Option A: ISO string everywhere (safe for JSON)
 * - Option B: Date objects in runtime + serialize at boundary
 *
 * This module supports both.
 */

export const zIsoDateTime = z.string().datetime({ offset: true });

/** Accept Date | string and output ISO string */
export const zIsoDateTimeCoerce = z.preprocess((v) => {
  if (v instanceof Date) return v.toISOString();
  return v;
}, zIsoDateTime);

/** Accept Date | string and output Date */
export const zDateCoerce = z.preprocess((v) => {
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d;
  }
  return v;
}, z.date());

/** Serialize Date -> ISO (good for API responses) */
export const zDateToIso = z.date().transform((d) => d.toISOString());
