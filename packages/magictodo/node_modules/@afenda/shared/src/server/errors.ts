/**
 * HTTP Error Classes
 * Standardized error handling for API routes.
 *
 * @domain shared
 * @layer server
 */

/**
 * Base HTTP error class for consistent error handling in API routes.
 * Maps to envelope `fail()` shape with code, message, and optional requestId.
 */
export class HttpError extends Error {
  public override readonly name = "HttpError" as const;

  constructor(
    public override readonly message: string,
    public readonly status: number = 500,
    public readonly code: string = "INTERNAL"
  ) {
    super(message);
  }

  /** Serialize to API error payload for envelope responses. */
  toApiError(requestId?: string) {
    return {
      code: this.code,
      message: this.message,
      requestId,
    };
  }
}

/** Factory: 401 Unauthorized */
export function Unauthorized(message = "Unauthorized"): HttpError {
  return new HttpError(message, 401, "UNAUTHORIZED");
}

/** Factory: 404 Not Found */
export function NotFound(message = "Not found"): HttpError {
  return new HttpError(message, 404, "NOT_FOUND");
}

/** Factory: 400 Bad Request */
export function BadRequest(message = "Bad request"): HttpError {
  return new HttpError(message, 400, "BAD_REQUEST");
}

/** Factory: 403 Forbidden */
export function Forbidden(message = "Forbidden"): HttpError {
  return new HttpError(message, 403, "FORBIDDEN");
}

/** Factory: 409 Conflict */
export function Conflict(message = "Conflict"): HttpError {
  return new HttpError(message, 409, "CONFLICT");
}
