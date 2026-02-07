import type { z } from "zod";

/** Infer output type (post-parse) */
export type InferOut<TSchema extends z.ZodTypeAny> = z.output<TSchema>;

/** Infer input type (pre-parse) */
export type InferIn<TSchema extends z.ZodTypeAny> = z.input<TSchema>;

/**
 * Helper type for “schema modules” that expose Schema + types.
 * (No runtime overhead, helps standardize exports.)
 */
export type ZodModule<TSchema extends z.ZodTypeAny> = {
  Schema: TSchema;
  In: InferIn<TSchema>;
  Out: InferOut<TSchema>;
};
