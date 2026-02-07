import { z } from "zod";

/**
 * Zod Pipeline DSL
 * Goal: make sanitization + normalization consistent and reusable.
 *
 * Usage:
 *   const zName = pipeString().trim().collapseSpaces().singleLine().min(1).max(120).schema();
 */

type AnySchema = z.ZodTypeAny;

function makeStringBase() {
  return z.string();
}

export function pipeString(base: z.ZodString = makeStringBase()) {
  let s: z.ZodTypeAny = base;

  const api = {
    /** trim leading/trailing whitespace */
    trim() {
      s = (s as z.ZodString).transform((v) => v.trim());
      return api;
    },

    /** collapse multi-whitespace to single spaces */
    collapseSpaces() {
      s = (s as z.ZodString).transform((v) => v.replace(/\s+/g, " ").trim());
      return api;
    },

    /** remove tabs/newlines to force a single line */
    singleLine() {
      s = (s as z.ZodString).transform((v) => v.replace(/[\r\n\t]+/g, " ").trim());
      return api;
    },

    /** lowercase */
    lower() {
      s = (s as z.ZodString).transform((v) => v.toLowerCase());
      return api;
    },

    /** uppercase */
    upper() {
      s = (s as z.ZodString).transform((v) => v.toUpperCase());
      return api;
    },

    /** convert empty string to undefined */
    emptyToUndefined() {
      s = (s as z.ZodString).transform((v) => {
        const t = v.trim();
        return t.length ? t : undefined;
      });
      return api;
    },

    /** convert empty string to null */
    emptyToNull() {
      s = (s as z.ZodString).transform((v) => {
        const t = v.trim();
        return t.length ? t : null;
      });
      return api;
    },

    /** regex validation */
    regex(re: RegExp, message?: string) {
      s = (s as z.ZodString).pipe(z.string().regex(re, message));
      return api;
    },

    /** length rules */
    min(n: number, message?: string) {
      s = (s as z.ZodString).pipe(z.string().min(n, message));
      return api;
    },
    max(n: number, message?: string) {
      s = (s as z.ZodString).pipe(z.string().max(n, message));
      return api;
    },

    /** finalize schema */
    schema<T extends AnySchema = typeof s>() {
      return s as T;
    },
  };

  return api;
}

/**
 * Number pipeline (coercion + clamp)
 * Usage:
 *   const zPage = pipeInt().min(1).max(1_000_000).default(1).schema();
 */
export function pipeInt() {
  let s: z.ZodTypeAny = z.coerce.number().int();

  const api = {
    min(n: number, message?: string) {
      s = s.pipe(z.number().int().min(n, message));
      return api;
    },
    max(n: number, message?: string) {
      s = s.pipe(z.number().int().max(n, message));
      return api;
    },
    clamp(min: number, max: number, fallback: number) {
      s = z.preprocess((v) => {
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) return fallback;
        const i = Math.trunc(n);
        if (i < min) return min;
        if (i > max) return max;
        return i;
      }, z.number().int().min(min).max(max));
      return api;
    },
    default(value: number) {
      s = (s as z.ZodTypeAny).default(value);
      return api;
    },
    schema<T extends AnySchema = typeof s>() {
      return s as T;
    },
  };

  return api;
}
