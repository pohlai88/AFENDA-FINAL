import { z } from "zod";

import { LIMITS } from "../constant";

/**
 * String sanitizers.
 * These are “building blocks” you compose into schemas.
 */

export const zTrim = z.string().transform((s) => s.trim());

export const zNonEmpty = zTrim.pipe(z.string().min(1));

export const zLower = zTrim.transform((s) => s.toLowerCase());
export const zUpper = zTrim.transform((s) => s.toUpperCase());

export const zSingleLine = zTrim.transform((s) => s.replace(/[\r\n\t]+/g, " "));

/** Collapse multiple spaces into one */
export const zCollapseSpaces = zTrim.transform((s) => s.replace(/\s+/g, " "));

/** Optional string that becomes undefined if empty after trim */
export const zOptionalString = z
  .string()
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    const t = v.trim();
    return t.length ? t : undefined;
  });

/** Nullable string that becomes null if empty after trim */
export const zNullableString = z
  .string()
  .nullable()
  .transform((v) => {
    if (v === null) return null;
    const t = v.trim();
    return t.length ? t : null;
  });

/**
 * Safe “search query” sanitizer:
 * - single line
 * - collapse spaces
 * - cap length to prevent abuse
 */
export const zSearchQuery = z
  .string()
  .optional()
  .transform((v) => (v ?? "").toString())
  .pipe(zCollapseSpaces)
  .pipe(z.string().max(LIMITS.MAX_SEARCH_LENGTH));
