/**
 * @layer domain (magicdrive)
 * @responsibility Audit API contracts (hash verification, integrity).
 */

import { z } from "zod";

/** Single mismatch entry for hash audit */
export const AuditHashMismatchSchema = z.object({
  versionId: z.string(),
  objectId: z.string(),
  expected: z.string(),
  actual: z.string(),
});

/** Single error entry for hash audit */
export const AuditHashErrorSchema = z.object({
  versionId: z.string(),
  error: z.string(),
});

/** Hash audit result (v1 audit/hash response) */
export const AuditHashResultSchema = z.object({
  sampled: z.number().int().min(0),
  checked: z.number().int().min(0),
  matched: z.number().int().min(0),
  mismatched: z.array(AuditHashMismatchSchema),
  errors: z.array(AuditHashErrorSchema),
});

export type AuditHashMismatch = z.infer<typeof AuditHashMismatchSchema>;
export type AuditHashError = z.infer<typeof AuditHashErrorSchema>;
export type AuditHashResult = z.infer<typeof AuditHashResultSchema>;
