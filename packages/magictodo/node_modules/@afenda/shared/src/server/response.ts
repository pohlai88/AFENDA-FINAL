/**
 * API Response Helpers
 * Standardized response envelope for all API routes.
 *
 * @see 01-AGENT: All APIs return ok()/fail() envelope, include x-request-id
 * @see 02-ARCHITECTURE § 7: Response Envelope (Mandatory)
 *
 * @domain shared
 * @layer server
 */

import { HEADER_NAMES } from "../constants";

export { ok, fail, KERNEL_ERROR_CODES } from "./envelope";

export type {
  KernelEnvelope,
  KernelEnvelopeOk,
  KernelEnvelopeFail,
  KernelApiError,
  KernelErrorCode,
} from "./envelope";

/**
 * Standard headers for envelope API responses (`x-request-id`, `x-trace-id`).
 *
 * @example
 * ```ts
 * const headers = envelopeHeaders(traceId);
 * return NextResponse.json(ok(data, { traceId }), { status: HTTP_STATUS.OK, headers });
 * ```
 */
export function envelopeHeaders(requestId: string): Record<string, string> {
  return {
    [HEADER_NAMES.REQUEST_ID]: requestId,
    [HEADER_NAMES.TRACE_ID]: requestId,
  };
}

/**
 * Build a JSON Response with ok/fail envelope.
 * Includes `x-request-id` and `x-trace-id` when requestId is provided.
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
