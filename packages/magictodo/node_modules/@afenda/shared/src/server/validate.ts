/**
 * Request Validation Helpers
 * Parse and validate request data using schema objects.
 *
 * Uses duck-typed constraints so callers can pass schemas from
 * **any** zod version (v3 or v4) — avoids coupling shared to a
 * specific zod release while the monorepo migrates.
 *
 * @domain shared
 * @layer server
 */

import { BadRequest } from "./errors";

/**
 * Minimal contract a schema must satisfy — compatible with both
 * zod v3 (`z.ZodTypeAny`) and zod v4 (`z.ZodType`) objects.
 */
export interface ParseableSchema<TOut = unknown> {
  parse(data: unknown): TOut;
}

/** Duck-type check for zod-style validation errors (v3 & v4). */
function isValidationError(
  e: unknown
): e is { issues: { message: string }[] } {
  return (
    typeof e === "object" &&
    e !== null &&
    "issues" in e &&
    Array.isArray((e as { issues: unknown }).issues)
  );
}

/** Format validation issue messages into a human-readable string. */
function formatIssues(issues: { message: string }[]): string {
  return issues.map((i) => i.message).join(", ");
}

/**
 * Parse a JSON request body against a schema.
 * Throws `BadRequest` (400) on validation failures.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * const body = await parseJson(request, z.object({ name: z.string() }));
 * ```
 */
export async function parseJson<T>(
  request: Request,
  schema: ParseableSchema<T>
): Promise<T> {
  try {
    const body: unknown = await request.json();
    return schema.parse(body);
  } catch (e) {
    if (isValidationError(e)) {
      throw BadRequest(`Validation error: ${formatIssues(e.issues)}`);
    }
    throw BadRequest("Invalid JSON");
  }
}

/**
 * Parse URL search params against a schema.
 * Throws `BadRequest` (400) on validation failures.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * const query = parseSearchParams(url.searchParams, z.object({ page: z.coerce.number() }));
 * ```
 */
export function parseSearchParams<T>(
  params: URLSearchParams,
  schema: ParseableSchema<T>
): T {
  try {
    const obj = Object.fromEntries(params.entries());
    return schema.parse(obj);
  } catch (e) {
    if (isValidationError(e)) {
      throw BadRequest(`Validation error: ${formatIssues(e.issues)}`);
    }
    throw BadRequest("Invalid query parameters");
  }
}
