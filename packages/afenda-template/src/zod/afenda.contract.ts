import { z } from "zod";

import { makeApiEnvelopeSchema, type ApiEnvelope, type ApiError } from "./_zod.api.envelope";
import { parseOrThrow } from "./_zod.parse";
import { zIsoDateTime } from "./_zod.datetime";
import { zPaginationInput } from "./_zod.pagination";
import { zSearchQuery } from "./_zod.string";

export const zAfendaStatus = z.enum(["initializing", "initialized", "degraded"]);
export type AfendaStatus = z.infer<typeof zAfendaStatus>;

export const AfendaBootstrapResponseSchema = z.object({
  status: zAfendaStatus,
  version: z.string().min(1).max(32),
  readyAt: zIsoDateTime,
});

export type AfendaBootstrapResponse = z.infer<typeof AfendaBootstrapResponseSchema>;

export const AfendaBootstrapEnvelopeSchema = makeApiEnvelopeSchema(AfendaBootstrapResponseSchema);
export type AfendaBootstrapEnvelope = z.infer<typeof AfendaBootstrapEnvelopeSchema>;

export class AfendaContractError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = "AfendaContractError";
  }
}

export function parseAfendaBootstrapEnvelope(input: unknown): AfendaBootstrapEnvelope {
  return parseOrThrow(AfendaBootstrapEnvelopeSchema, input);
}

export function expectAfendaBootstrapData(input: unknown): AfendaBootstrapResponse {
  const envelope = parseAfendaBootstrapEnvelope(input);
  if (!envelope.ok) {
    throw new AfendaContractError(envelope.error);
  }
  return envelope.data;
}

export const AfendaListQuerySchema = zPaginationInput.extend({
  query: zSearchQuery.default(""),
});

export type AfendaListQuery = z.infer<typeof AfendaListQuerySchema>;

export type AfendaBootstrapApiEnvelope = ApiEnvelope<AfendaBootstrapResponse>;
