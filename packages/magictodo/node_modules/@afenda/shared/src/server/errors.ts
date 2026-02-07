/**
 * HTTP Error Classes
 * Standardized error handling for API routes
 */

export class HttpError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code: string = "INTERNAL"
  ) {
    super(message)
    this.name = "HttpError"
  }

  toApiError(requestId?: string) {
    return {
      code: this.code,
      message: this.message,
      requestId,
    }
  }
}

export function Unauthorized(message = "Unauthorized"): HttpError {
  return new HttpError(message, 401, "UNAUTHORIZED")
}

export function NotFound(message = "Not found"): HttpError {
  return new HttpError(message, 404, "NOT_FOUND")
}

export function BadRequest(message = "Bad request"): HttpError {
  return new HttpError(message, 400, "BAD_REQUEST")
}

export function Forbidden(message = "Forbidden"): HttpError {
  return new HttpError(message, 403, "FORBIDDEN")
}

export function Conflict(message = "Conflict"): HttpError {
  return new HttpError(message, 409, "CONFLICT")
}
