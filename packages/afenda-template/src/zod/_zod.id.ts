import { z } from "zod";

/**
 * Keep IDs generic until you standardize (uuid/cuid/nanoid).
 */

const TRACE_ID_PATTERN = /^[A-Za-z0-9]+(?:_[A-Za-z0-9._-]+)+$/;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

export const zId = z.string().trim().min(1).max(128);

export const zTraceId = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(TRACE_ID_PATTERN, "Invalid trace id format");

export const zRequestId = z
  .string()
  .trim()
  .min(6)
  .max(128)
  .regex(REQUEST_ID_PATTERN, "Invalid request id format");

/** Slug (safe-ish) */
export const zSlug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug")
  .max(80);
