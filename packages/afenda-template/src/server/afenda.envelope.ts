/**
 * API envelope helpers (server-side friendly, but pure).
 * Aligns with constant API_ENVELOPE_KEYS.
 */

import {
  API_ENVELOPE_KEYS,
  type ApiEnvelopeKey,
  LOG_CONTEXT_KEYS,
} from "../constant";

export type ApiMeta = Record<string, unknown>;

export type ApiOk<T> = {
  [API_ENVELOPE_KEYS.OK]: true;
  [API_ENVELOPE_KEYS.DATA]: T;
  [API_ENVELOPE_KEYS.MESSAGE]?: string;
  [API_ENVELOPE_KEYS.META]?: ApiMeta;
  [API_ENVELOPE_KEYS.TRACE_ID]?: string;
};

export type ApiFail<E = unknown> = {
  [API_ENVELOPE_KEYS.OK]: false;
  [API_ENVELOPE_KEYS.ERROR]: E;
  [API_ENVELOPE_KEYS.MESSAGE]?: string;
  [API_ENVELOPE_KEYS.META]?: ApiMeta;
  [API_ENVELOPE_KEYS.TRACE_ID]?: string;
};

export type ApiEnvelope<T, E = unknown> = ApiOk<T> | ApiFail<E>;

export function apiOk<T>(data: T, opts?: { message?: string; meta?: ApiMeta; traceId?: string }): ApiOk<T> {
  const out: any = {
    [API_ENVELOPE_KEYS.OK]: true,
    [API_ENVELOPE_KEYS.DATA]: data,
  };
  if (opts?.message) out[API_ENVELOPE_KEYS.MESSAGE] = opts.message;
  if (opts?.meta) out[API_ENVELOPE_KEYS.META] = opts.meta;
  if (opts?.traceId) out[API_ENVELOPE_KEYS.TRACE_ID] = opts.traceId;
  return out as ApiOk<T>;
}

export function apiFail<E>(
  error: E,
  opts?: { message?: string; meta?: ApiMeta; traceId?: string }
): ApiFail<E> {
  const out: any = {
    [API_ENVELOPE_KEYS.OK]: false,
    [API_ENVELOPE_KEYS.ERROR]: error,
  };
  if (opts?.message) out[API_ENVELOPE_KEYS.MESSAGE] = opts.message;
  if (opts?.meta) out[API_ENVELOPE_KEYS.META] = opts.meta;
  if (opts?.traceId) out[API_ENVELOPE_KEYS.TRACE_ID] = opts.traceId;
  return out as ApiFail<E>;
}
