/**
 * Request Validation Helpers
 * Parse and validate request data using Zod schemas
 */

import { z } from "zod"
import { BadRequest } from "./errors"

export async function parseJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw BadRequest(`Validation error: ${e.issues.map((err: z.ZodIssue) => err.message).join(", ")}`)
    }
    throw BadRequest("Invalid JSON")
  }
}

export function parseSearchParams<T extends z.ZodTypeAny>(
  params: URLSearchParams,
  schema: T
): z.infer<T> {
  try {
    const obj = Object.fromEntries(params.entries())
    return schema.parse(obj)
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw BadRequest(`Validation error: ${e.issues.map((err: z.ZodIssue) => err.message).join(", ")}`)
    }
    throw BadRequest("Invalid query parameters")
  }
}
