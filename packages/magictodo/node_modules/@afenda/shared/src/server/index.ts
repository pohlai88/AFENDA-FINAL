/**
 * Shared server utilities barrel export.
 * All server-side utilities for cross-domain use.
 *
 * @domain shared
 * @layer server
 */

export { db, getDb, getDbClient, type Database } from "./db";
export {
  ok,
  fail,
  KERNEL_ERROR_CODES,
  envelopeHeaders,
  jsonResponse,
  type KernelEnvelope,
  type KernelEnvelopeOk,
  type KernelEnvelopeFail,
  type KernelApiError,
  type KernelErrorCode,
} from "./response";
export { HttpError, Unauthorized, NotFound, BadRequest, Forbidden, Conflict } from "./errors";
export { parseJson, parseSearchParams } from "./validate";
export { getAppBaseUrl } from "./app-base-url";
