/**
 * API versions, envelope structure, and defaults.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Versions
 * --------------------------------------------- */
export const API_VERSIONS = {
  V1: "v1",
  V2: "v2",
} as const;

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS];

const ApiVersionEnum = makeStringEnum(API_VERSIONS);

/** Stable list of supported API versions (runtime safe). */
export const API_VERSION_LIST = ApiVersionEnum.list as readonly ApiVersion[];

/** Runtime guard: is this a supported API version? */
export const isApiVersion = ApiVersionEnum.is;

/** Normalizer: returns supported version or fallback. */
export function toApiVersion(value: unknown, fallback: ApiVersion = API_VERSIONS.V1): ApiVersion {
  return ApiVersionEnum.to(value, fallback) as ApiVersion;
}

/** ---------------------------------------------
 * Envelope keys
 * --------------------------------------------- */
export const API_ENVELOPE_KEYS = {
  OK: "ok",
  DATA: "data",
  ERROR: "error",
  MESSAGE: "message",
  META: "meta",
  TRACE_ID: "traceId",
} as const;

export type ApiEnvelopeKey = (typeof API_ENVELOPE_KEYS)[keyof typeof API_ENVELOPE_KEYS];

const ApiEnvelopeKeyEnum = makeStringEnum(API_ENVELOPE_KEYS);

export const API_ENVELOPE_KEY_LIST = ApiEnvelopeKeyEnum.list as readonly ApiEnvelopeKey[];
export const isApiEnvelopeKey = ApiEnvelopeKeyEnum.is;

export function toApiEnvelopeKey(
  value: unknown,
  fallback: ApiEnvelopeKey = API_ENVELOPE_KEYS.DATA
): ApiEnvelopeKey {
  return ApiEnvelopeKeyEnum.to(value, fallback) as ApiEnvelopeKey;
}

/** ---------------------------------------------
 * Defaults
 * --------------------------------------------- */
export const API_DEFAULTS = {
  /** Default request timeout for API calls (ms). */
  TIMEOUT_MS: 15_000,

  /** Max retry attempts for retryable failures. */
  RETRY_MAX: 2,

  /** Base delay used for backoff calculations (ms). */
  RETRY_BASE_DELAY_MS: 400,

  /** Clamp to avoid unbounded exponential backoff (ms). */
  RETRY_MAX_DELAY_MS: 5_000,
} as const;

export type ApiDefaults = Readonly<typeof API_DEFAULTS>;

/**
 * Compute retry delay with simple exponential backoff + clamp.
 * - attemptIndex: 0-based (0 = first retry delay)
 */
export function getRetryDelayMs(
  attemptIndex: number,
  baseDelayMs: number = API_DEFAULTS.RETRY_BASE_DELAY_MS,
  maxDelayMs: number = API_DEFAULTS.RETRY_MAX_DELAY_MS
): number {
  const idx = Number.isFinite(attemptIndex) ? Math.max(0, Math.floor(attemptIndex)) : 0;
  const raw = baseDelayMs * Math.pow(2, idx);
  return Math.min(Math.max(0, raw), maxDelayMs);
}
