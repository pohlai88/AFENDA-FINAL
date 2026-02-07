/**
 * Orchestra Kernel Configuration Template Schemas
 * Type definitions for configuration templates with validation rules.
 *
 * Zero domain knowledge — generic template system.
 */

import { z } from "zod";

/**
 * Validation rule types for template fields
 */
export const TemplateValidationRuleSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("string"),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  }),
  z.object({
    type: z.literal("number"),
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  z.object({
    type: z.literal("boolean"),
  }),
  z.object({
    type: z.literal("email"),
  }),
  z.object({
    type: z.literal("url"),
  }),
  z.object({
    type: z.literal("color"),
  }),
  z.object({
    type: z.literal("timezone"),
  }),
  z.object({
    type: z.literal("locale"),
    enum: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal("array"),
    items: z.object({
      type: z.string(),
    }).optional(),
  }),
  z.object({
    type: z.literal("enum"),
    enum: z.array(z.string()),
  }),
]);

export type TemplateValidationRule = z.infer<typeof TemplateValidationRuleSchema>;

/**
 * Individual configuration field in a template
 */
export const ConfigFieldSchema = z.object({
  key: z.string().describe("Configuration key (without scope prefix)"),
  value: z.unknown().describe("Default value for this field"),
  description: z.string().describe("Human-readable description"),
  required: z.boolean().describe("Whether this field is required"),
  validation: TemplateValidationRuleSchema.describe("Validation rules for this field"),
});

export type ConfigField = z.infer<typeof ConfigFieldSchema>;

/**
 * Template categories
 */
export const TemplateCategorySchema = z.enum([
  "System",
  "Tenant",
  "Service",
  "Compliance",
]);

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

/**
 * Configuration template definition
 */
export const ConfigTemplateSchema = z.object({
  id: z.string().describe("Unique template identifier"),
  name: z.string().describe("Display name"),
  description: z.string().describe("Template description"),
  category: TemplateCategorySchema.describe("Template category"),
  icon: z.string().describe("Icon name (Tabler icon)"),
  configs: z.array(ConfigFieldSchema).describe("Configuration fields in this template"),
});

export type ConfigTemplate = z.infer<typeof ConfigTemplateSchema>;

/**
 * Environment preset definition
 */
export const TemplatePresetSchema = z.object({
  id: z.string().describe("Preset identifier"),
  name: z.string().describe("Display name"),
  description: z.string().describe("Preset description"),
  templates: z.array(z.string()).describe("Template IDs included in this preset"),
});

export type TemplatePreset = z.infer<typeof TemplatePresetSchema>;

/**
 * Template list response (for BFF)
 */
export const TemplateListResponseSchema = z.object({
  categories: z.array(TemplateCategorySchema),
  templates: z.array(ConfigTemplateSchema),
  presets: z.array(TemplatePresetSchema),
});

export type TemplateListResponse = z.infer<typeof TemplateListResponseSchema>;

/**
 * Template application request
 */
export const ApplyTemplateRequestSchema = z.object({
  templateId: z.string(),
  values: z.record(z.unknown()).describe("User-provided values for template fields"),
});

export type ApplyTemplateRequest = z.infer<typeof ApplyTemplateRequestSchema>;

/**
 * Template validation request
 */
export const ValidateTemplateRequestSchema = z.object({
  templateId: z.string(),
  values: z.record(z.unknown()),
});

export type ValidateTemplateRequest = z.infer<typeof ValidateTemplateRequestSchema>;

/**
 * Template validation response
 */
export const TemplateValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.record(z.string()).optional().describe("Field-level error messages"),
});

export type TemplateValidationResult = z.infer<typeof TemplateValidationResultSchema>;

/**
 * Custom Template Status
 */
export const TemplateStatusSchema = z.enum(["draft", "published", "archived"]);
export type TemplateStatus = z.infer<typeof TemplateStatusSchema>;

/**
 * Create Custom Template Request
 */
export const CreateCustomTemplateRequestSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  category: TemplateCategorySchema,
  icon: z.string().default("IconSettings"),
  configs: z.array(ConfigFieldSchema).min(1),
  status: TemplateStatusSchema.default("draft"),
  tags: z.array(z.string()).optional(),
});

export type CreateCustomTemplateRequest = z.infer<typeof CreateCustomTemplateRequestSchema>;

/**
 * Update Custom Template Request
 */
export const UpdateCustomTemplateRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  category: TemplateCategorySchema.optional(),
  icon: z.string().optional(),
  configs: z.array(ConfigFieldSchema).optional(),
  status: TemplateStatusSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateCustomTemplateRequest = z.infer<typeof UpdateCustomTemplateRequestSchema>;

/**
 * Delete Custom Template Request
 */
export const DeleteCustomTemplateRequestSchema = z.object({
  id: z.string().uuid(),
  permanent: z.boolean().default(false), // true = hard delete, false = archive
});

export type DeleteCustomTemplateRequest = z.infer<typeof DeleteCustomTemplateRequestSchema>;

/**
 * Archive/Restore Template Request
 */
export const ArchiveTemplateRequestSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["archive", "restore"]),
});

export type ArchiveTemplateRequest = z.infer<typeof ArchiveTemplateRequestSchema>;

/**
 * Publish Template Request
 */
export const PublishTemplateRequestSchema = z.object({
  id: z.string().uuid(),
  version: z.string().optional(),
});

export type PublishTemplateRequest = z.infer<typeof PublishTemplateRequestSchema>;

/**
 * Custom Template Response (includes DB fields)
 */
export const CustomTemplateResponseSchema = ConfigTemplateSchema.extend({
  status: TemplateStatusSchema,
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date().optional(),
  archivedAt: z.date().optional(),
  appliedCount: z.string().optional(),
  lastAppliedAt: z.date().optional(),
});

export type CustomTemplateResponse = z.infer<typeof CustomTemplateResponseSchema>;
