/**
 * Constant-layer core helpers.
 *
 * Goal: generic, robust, verbose, and side-effect free.
 * - Keep constants as the SSOT (single source of truth)
 * - Derive union types from `as const` objects
 * - Provide runtime guards + safe normalizers for unknown inputs
 *
 * NOTE: No external dependencies. No environment access. Pure functions only.
 */

/** Extract strongly-typed values array from a record-like constant object. */
export function valuesOf<const T extends Record<string, string | number | boolean>>(obj: T) {
  return Object.values(obj) as Array<T[keyof T]>;
}

/** Narrow `unknown` to `string` (helper for guards). */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** Narrow `unknown` to `number` (helper for guards). */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Create a runtime guard + list + normalizer for string-enum style constants. */
export function makeStringEnum<const T extends Record<string, string>>(obj: T) {
  const list = Object.values(obj) as unknown as readonly T[keyof T][];

  return {
    /** Stable list of allowed values (useful for UI or validation). */
    list,

    /** Runtime guard: checks whether value is one of the enum values. */
    is(value: unknown): value is T[keyof T] {
      return isString(value) && (list as readonly string[]).includes(value);
    },

    /**
     * Normalizer: returns value if valid; otherwise returns fallback.
     * Use this when parsing query params, headers, cookies, env, etc.
     */
    to(value: unknown, fallback: T[keyof T]): T[keyof T] {
      return this.is(value) ? value : fallback;
    },
  } as const;
}

/** Create a runtime guard + list + normalizer for number-enum style constants. */
export function makeNumberEnum<const T extends Record<string, number>>(obj: T) {
  const list = Object.values(obj) as unknown as readonly T[keyof T][];

  return {
    list,
    is(value: unknown): value is T[keyof T] {
      return isNumber(value) && (list as readonly number[]).includes(value);
    },
    to(value: unknown, fallback: T[keyof T]): T[keyof T] {
      return this.is(value) ? value : fallback;
    },
  } as const;
}

/** Clamp integer safely (useful for pagination + limits). */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (!isNumber(value)) return fallback;
  const v = Math.floor(value);
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
