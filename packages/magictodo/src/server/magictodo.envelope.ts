/**
 * magictodo domain API envelope helpers.
 */

export type ApiMeta = Record<string, unknown>;

export type ApiOk<T> = {
  ok: true;
  data: T;
  message?: string;
  meta?: ApiMeta;
  traceId?: string;
};

export type ApiFail<E = unknown> = {
  ok: false;
  error: E;
  message?: string;
  meta?: ApiMeta;
  traceId?: string;
};

export type ApiEnvelope<T, E = unknown> = ApiOk<T> | ApiFail<E>;

export function apiOk<T>(data: T, opts?: { message?: string; meta?: ApiMeta; traceId?: string }): ApiOk<T> {
  return {
    ok: true,
    data,
    ...(opts?.message && { message: opts.message }),
    ...(opts?.meta && { meta: opts.meta }),
    ...(opts?.traceId && { traceId: opts.traceId }),
  };
}

export function apiFail<E>(
  error: E,
  opts?: { message?: string; meta?: ApiMeta; traceId?: string }
): ApiFail<E> {
  return {
    ok: false,
    error,
    ...(opts?.message && { message: opts.message }),
    ...(opts?.meta && { meta: opts.meta }),
    ...(opts?.traceId && { traceId: opts.traceId }),
  };
}
