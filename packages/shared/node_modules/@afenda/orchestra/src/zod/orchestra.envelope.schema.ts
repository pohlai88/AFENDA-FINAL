/**
 * Orchestra Kernel API Envelope Schema
 * Generic { ok: true, data } | { ok: false, error } contract
 *
 * Zero domain knowledge — reusable across all services.
 */

import { z, type ZodTypeAny } from "zod";

/** Error codes for kernel operations */
export const KERNEL_ERROR_CODES = {
  UNKNOWN: "KERNEL_UNKNOWN",
  VALIDATION: "KERNEL_VALIDATION",
  UNAUTHORIZED: "KERNEL_UNAUTHORIZED",
  NOT_FOUND: "KERNEL_NOT_FOUND",
  CONFLICT: "KERNEL_CONFLICT",
  INTERNAL: "KERNEL_INTERNAL",
  SERVICE_UNAVAILABLE: "KERNEL_SERVICE_UNAVAILABLE",
} as const;

export type KernelErrorCode = (typeof KERNEL_ERROR_CODES)[keyof typeof KERNEL_ERROR_CODES];

const KERNEL_ERROR_CODE_VALUES = Object.values(KERNEL_ERROR_CODES) as [KernelErrorCode, ...KernelErrorCode[]];

/** Standard API error shape */
export const KernelApiErrorSchema = z.object({
  code: z.enum(KERNEL_ERROR_CODE_VALUES),
  message: z.string().min(1),
  details: z.unknown().optional(),
  requestId: z.string().uuid().optional(),
});

export type KernelApiError = z.infer<typeof KernelApiErrorSchema>;

/** Metadata shape for envelope */
export const KernelMetaSchema = z.record(z.string(), z.unknown()).optional();

export type KernelMeta = z.infer<typeof KernelMetaSchema>;

/** Ok envelope schema factory */
export function makeOkEnvelopeSchema<TSchema extends ZodTypeAny>(dataSchema: TSchema) {
  return z.object({
    ok: z.literal(true),
    data: dataSchema,
    error: z.undefined().optional(),
    message: z.string().optional(),
    meta: KernelMetaSchema,
    traceId: z.string().optional(),
  });
}

/** Fail envelope schema */
export const FailEnvelopeSchema = z.object({
  ok: z.literal(false),
  data: z.undefined().optional(),
  error: KernelApiErrorSchema,
  message: z.string().optional(),
  meta: KernelMetaSchema,
  traceId: z.string().optional(),
});

/** Combined envelope schema factory */
export function makeEnvelopeSchema<TSchema extends ZodTypeAny>(dataSchema: TSchema) {
  return z.union([makeOkEnvelopeSchema(dataSchema), FailEnvelopeSchema]);
}

/** Type helpers */
export type KernelEnvelopeOk<T> = {
  ok: true;
  data: T;
  error?: undefined;
  message?: string;
  meta?: Record<string, unknown>;
  traceId?: string;
};

export type KernelEnvelopeFail = {
  ok: false;
  data?: undefined;
  error: KernelApiError;
  message?: string;
  meta?: Record<string, unknown>;
  traceId?: string;
};

export type KernelEnvelope<T> = KernelEnvelopeOk<T> | KernelEnvelopeFail;

/** Helper to create successful envelope */
export function kernelOk<T>(
  data: T,
  opts?: { message?: string; meta?: Record<string, unknown>; traceId?: string }
): KernelEnvelopeOk<T> {
  return {
    ok: true,
    data,
    ...(opts?.message && { message: opts.message }),
    ...(opts?.meta && { meta: opts.meta }),
    ...(opts?.traceId && { traceId: opts.traceId }),
  };
}

/** Helper to create failure envelope */
export function kernelFail(
  error: KernelApiError,
  opts?: { message?: string; meta?: Record<string, unknown>; traceId?: string }
): KernelEnvelopeFail {
  return {
    ok: false,
    error,
    ...(opts?.message && { message: opts.message }),
    ...(opts?.meta && { meta: opts.meta }),
    ...(opts?.traceId && { traceId: opts.traceId }),
  };
}
