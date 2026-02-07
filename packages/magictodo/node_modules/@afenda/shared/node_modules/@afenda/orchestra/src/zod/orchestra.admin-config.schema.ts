/**
 * Orchestra Kernel Admin Config Schema
 * Generic key-value configuration store.
 *
 * Zero domain knowledge — stores any config, doesn't validate semantics.
 */

import { z } from "zod";

/** Config value can be any JSON-serializable type */
export const ConfigValueSchema = z.unknown();

/** Config key constraints */
export const ConfigKeySchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z][a-z0-9._-]*$/i, "Config key must start with letter, contain only alphanumeric, dots, underscores, hyphens");

/** Single config entry schema */
export const ConfigEntrySchema = z.object({
  key: ConfigKeySchema,
  value: ConfigValueSchema,
  description: z.string().max(512).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().nullable(),
});

export type ConfigEntry = z.infer<typeof ConfigEntrySchema>;

/** Input for setting config */
export const SetConfigInputSchema = z.object({
  key: ConfigKeySchema,
  value: ConfigValueSchema,
  description: z.string().max(512).optional(),
});

export type SetConfigInput = z.infer<typeof SetConfigInputSchema>;

/** Input for getting config */
export const GetConfigInputSchema = z.object({
  key: ConfigKeySchema,
});

export type GetConfigInput = z.infer<typeof GetConfigInputSchema>;

/** Bulk config operations */
export const BulkSetConfigInputSchema = z.object({
  entries: z.array(SetConfigInputSchema).min(1).max(100),
});

export type BulkSetConfigInput = z.infer<typeof BulkSetConfigInputSchema>;

/** Config list response */
export const ConfigListResponseSchema = z.object({
  configs: z.array(ConfigEntrySchema),
  total: z.number().int().nonnegative(),
});

export type ConfigListResponse = z.infer<typeof ConfigListResponseSchema>;

/** Common config namespaces (suggestions, not enforced) */
export const CONFIG_NAMESPACES = {
  SYSTEM: "system",
  TENANT: "tenant",
  FEATURE: "feature",
  LIMIT: "limit",
} as const;

export type ConfigNamespace = (typeof CONFIG_NAMESPACES)[keyof typeof CONFIG_NAMESPACES];
