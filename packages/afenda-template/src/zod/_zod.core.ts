import { z } from "zod";

/**
 * Zod Core — stage: runtime validation truth.
 * No DB schema here. No feature logic. Pure schemas + helpers.
 */

// ---------- primitives ----------
export const zNonEmptyString = z.string().trim().min(1);
export const zNullableString = z.string().nullable();
export const zOptionalString = z.string().optional();

export const zBoolCoerce = z.coerce.boolean();
export const zIntCoerce = z.coerce.number().int();
export const zPositiveInt = zIntCoerce.min(1);

// ---------- identifiers ----------
/**
 * Use a generic ID schema; refine later if you standardize UUID/CUID/NanoID.
 */
export const zId = zNonEmptyString.max(128);

/**
 * UUID if you enforce it (optional).
 */
export const zUuid = z.string().uuid();

// ---------- datetime ----------
/**
 * ISO string date-time (safe baseline).
 */
export const zIsoDateTime = z.string().datetime({ offset: true });

/**
 * Accept string/Date and normalize to ISO string.
 */
export const zIsoDateTimeCoerce = z.preprocess((v) => {
  if (v instanceof Date) return v.toISOString();
  return v;
}, zIsoDateTime);

// ---------- pagination ----------
export const zPage = zPositiveInt.default(1);
export const zPageSize = zPositiveInt.max(200).default(20);

export const zPaginationInput = z
  .object({
    page: zPage,
    pageSize: zPageSize,
  })
  .strict();

export type PaginationInput = z.infer<typeof zPaginationInput>;

// ---------- helpers ----------
export function formatZodError(err: z.ZodError) {
  return {
    issues: err.issues.map((i) => ({
      path: i.path.join("."),
      code: i.code,
      message: i.message,
    })),
  } as const;
}

/**
 * Parse with a consistent error shape (good for API envelope).
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const res = schema.safeParse(input);
  if (!res.success) {
    const e = new Error("ValidationError");
    (e as any).name = "ValidationError";
    (e as any).details = formatZodError(res.error);
    throw e;
  }
  return res.data;
}
