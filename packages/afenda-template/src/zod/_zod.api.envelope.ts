import { z, type ZodRawShape } from "zod";

import { API_ENVELOPE_KEYS, ERROR_CODE_LIST } from "../constant";
import type { ErrorCode } from "../constant";
import { zRequestId, zTraceId } from "./_zod.id";

/**
 * Runtime validation for API envelopes + strongly typed helpers.
 */

const ERROR_CODE_VALUES = ERROR_CODE_LIST as [ErrorCode, ...ErrorCode[]];

export const ApiErrorSchema = z.object({
  code: z.enum(ERROR_CODE_VALUES),
  message: z.string().min(1),
  details: z.unknown().optional(),
  requestId: zRequestId.optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

const { OK, DATA, ERROR, MESSAGE, META, TRACE_ID } = API_ENVELOPE_KEYS;

const ApiEnvelopeSharedShape = {
  [MESSAGE]: z.string().optional(),
  [META]: z.record(z.string(), z.unknown()).optional(),
  [TRACE_ID]: zTraceId.optional(),
} satisfies ZodRawShape;

export const ApiEnvelopeBaseSchema = z.object(ApiEnvelopeSharedShape).strict();

export function makeApiEnvelopeSchema<TSchema extends z.ZodTypeAny>(dataSchema: TSchema) {
  const okSchema = ApiEnvelopeBaseSchema.extend({
    [OK]: z.literal(true),
    [DATA]: dataSchema,
    [ERROR]: z.undefined().optional(),
  });

  const failSchema = ApiEnvelopeBaseSchema.extend({
    [OK]: z.literal(false),
    [DATA]: z.undefined().optional(),
    [ERROR]: ApiErrorSchema,
  });

  return z.union([okSchema, failSchema]);
}

export type ApiEnvelopeOk<TData> = {
  ok: true;
  data: TData;
  error?: undefined;
  message?: string;
  meta?: Record<string, unknown>;
  traceId?: string;
};

export type ApiEnvelopeFail = {
  ok: false;
  data?: undefined;
  error: ApiError;
  message?: string;
  meta?: Record<string, unknown>;
  traceId?: string;
};

export type ApiEnvelope<TData> = ApiEnvelopeOk<TData> | ApiEnvelopeFail;
