import { z } from "zod";

import { ERROR_CODES } from "../constant";
import type { ApiError } from "./_zod.api.envelope";

export type ValidationIssue = { path: string; message: string; code: string };

export type ValidationErrorDetails = { issues: ValidationIssue[] };

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError & { details: ValidationErrorDetails } };

export class ZodValidationError extends Error {
  constructor(public readonly error: ApiError & { details: ValidationErrorDetails }) {
    super(error.message);
    this.name = "ValidationError";
  }
}

const DEFAULT_VALIDATION_MESSAGE = "Payload validation failed";

export function formatZodIssues(err: z.ZodError): ValidationIssue[] {
  return err.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export function toValidationErrorDetails(err: z.ZodError, message = DEFAULT_VALIDATION_MESSAGE) {
  return {
    code: ERROR_CODES.VALIDATION,
    message,
    details: { issues: formatZodIssues(err) },
  } as ApiError & { details: ValidationErrorDetails };
}

export function safeParse<T>(schema: z.ZodType<T>, input: unknown, opts?: { message?: string }): ParseResult<T> {
  const res = schema.safeParse(input);
  if (!res.success) {
    return { ok: false, error: toValidationErrorDetails(res.error, opts?.message) };
  }
  return { ok: true, data: res.data };
}

/**
 * Throws a standardized error object.
 * Useful for server route handlers that are caught once.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown, opts?: { message?: string }): T {
  const result = safeParse(schema, input, opts);
  if (!result.ok) {
    throw new ZodValidationError(result.error);
  }
  return result.data;
}
