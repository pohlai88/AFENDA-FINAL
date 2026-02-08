/**
 * API Response Helpers
 * Standardized response envelope for all API routes
 * @see 01-AGENT: All APIs return ok()/fail() envelope, include x-request-id
 */

import { HEADER_NAMES } from "../constants";

export { ok, fail, KERNEL_ERROR_CODES } from "./envelope";

// Re-export for convenience
export type {
  KernelEnvelope,
  KernelEnvelopeOk,
  KernelEnvelopeFail,
  KernelApiError,
  KernelErrorCode,
} from "./envelope";

/**
 * Standard headers for envelope API responses (x-request-id, x-trace-id).
 * Use with NextResponse.json(body, { status, headers: envelopeHeaders(traceId) }).
 */
export function envelopeHeaders(requestId: string): Record<string, string> {
  return {
    [HEADER_NAMES.REQUEST_ID]: requestId,
    [HEADER_NAMES.TRACE_ID]: requestId,
  };
}

/**
 * Build a JSON Response with ok/fail envelope.
 * Use instead of NextResponse.json() to satisfy ESLint no-restricted-properties.
 * Includes x-request-id and x-trace-id when requestId is provided.
 */
export function jsonResponse(
  body: object,
  status: number,
  requestId?: string
): Response {
  const headersInit: HeadersInit = {
    "Content-Type": "application/json",
    ...(requestId ? envelopeHeaders(requestId) : {}),
  };
  return new Response(JSON.stringify(body), { status, headers: headersInit });
}
