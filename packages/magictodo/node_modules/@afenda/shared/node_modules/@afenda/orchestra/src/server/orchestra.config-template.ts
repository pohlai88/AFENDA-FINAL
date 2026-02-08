/**
 * Orchestra Kernel Configuration Template Service
 * Business logic for configuration templates.
 *
 * Zero domain knowledge — generic template system.
 */

import "server-only";

import type { Database } from "@afenda/shared/server/db";

import {
  CONFIG_TEMPLATES,
  TEMPLATE_PRESETS,
  TEMPLATE_CATEGORIES,
  getTemplateById,
  getTemplatesByCategory,
  getPresetById,
} from "../constant/orchestra.config-templates";
import type {
  ConfigTemplate,
  TemplatePreset,
  TemplateCategory,
  TemplateListResponse,
  ApplyTemplateRequest,
  ValidateTemplateRequest,
  TemplateValidationResult,
  TemplateValidationRule,
} from "../zod/orchestra.config-template.schema";
import {
  kernelOk,
  kernelFail,
  type KernelEnvelope,
  KERNEL_ERROR_CODES,
} from "../zod/orchestra.envelope.schema";
import { setConfig } from "./orchestra.admin-config";

export type ConfigTemplateDeps = {
  db: Database;
};

/**
 * List all available templates grouped by category
 */
export async function listTemplates(): Promise<KernelEnvelope<TemplateListResponse>> {
  try {
    const response: TemplateListResponse = {
      categories: TEMPLATE_CATEGORIES,
      templates: CONFIG_TEMPLATES,
      presets: TEMPLATE_PRESETS,
    };

    return kernelOk(response);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to list templates",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get a specific template by ID
 */
export async function getTemplate(
  templateId: string
): Promise<KernelEnvelope<ConfigTemplate>> {
  try {
    const template = getTemplateById(templateId);

    if (!template) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: `Template not found: ${templateId}`,
      });
    }

    return kernelOk(template);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to get template",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategoryName(
  category: TemplateCategory
): Promise<KernelEnvelope<ConfigTemplate[]>> {
  try {
    const templates = getTemplatesByCategory(category);
    return kernelOk(templates);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to get templates by category",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get a preset by ID
 */
export async function getPreset(
  presetId: string
): Promise<KernelEnvelope<TemplatePreset>> {
  try {
    const preset = getPresetById(presetId);

    if (!preset) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: `Preset not found: ${presetId}`,
      });
    }

    return kernelOk(preset);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to get preset",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Validate a value against a validation rule
 */
function validateValue(
  value: unknown,
  rule: TemplateValidationRule
): { valid: boolean; error?: string } {
  try {
    switch (rule.type) {
      case "string": {
        if (typeof value !== "string") {
          return { valid: false, error: "Must be a string" };
        }
        if (rule.minLength && value.length < rule.minLength) {
          return { valid: false, error: `Minimum length is ${rule.minLength}` };
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return { valid: false, error: `Maximum length is ${rule.maxLength}` };
        }
        if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
          return { valid: false, error: "Invalid format" };
        }
        return { valid: true };
      }

      case "number": {
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, error: "Must be a number" };
        }
        if (rule.min !== undefined && num < rule.min) {
          return { valid: false, error: `Minimum value is ${rule.min}` };
        }
        if (rule.max !== undefined && num > rule.max) {
          return { valid: false, error: `Maximum value is ${rule.max}` };
        }
        return { valid: true };
      }

      case "boolean": {
        if (typeof value !== "boolean") {
          return { valid: false, error: "Must be true or false" };
        }
        return { valid: true };
      }

      case "email": {
        if (typeof value !== "string") {
          return { valid: false, error: "Must be a string" };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { valid: false, error: "Invalid email address" };
        }
        return { valid: true };
      }

      case "url": {
        if (typeof value !== "string") {
          return { valid: false, error: "Must be a string" };
        }
        try {
          new URL(value);
          return { valid: true };
        } catch {
          return { valid: false, error: "Invalid URL" };
        }
      }

      case "color": {
        if (typeof value !== "string") {
          return { valid: false, error: "Must be a string" };
        }
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!colorRegex.test(value)) {
          return { valid: false, error: "Invalid color (use #RRGGBB format)" };
        }
        return { valid: true };
      }

      case "timezone": {
        if (typeof value !== "string") {
          return { valid: false, error: "Must be a string" };
        }
        // Basic timezone validation (could be enhanced)
        if (value.length === 0) {
          return { valid: false, error: "Timezone cannot be empty" };
        }
        return { valid: true };
      }

      case "locale": {
        if (typeof value !== "string") {
          return { valid: false, error: "Must be a string" };
        }
        if (rule.enum && !rule.enum.includes(value)) {
          return { valid: false, error: `Must be one of: ${rule.enum.join(", ")}` };
        }
        return { valid: true };
      }

      case "array": {
        if (!Array.isArray(value)) {
          return { valid: false, error: "Must be an array" };
        }
        return { valid: true };
      }

      case "enum": {
        if (typeof value !== "string") {
          return { valid: false, error: "Must be a string" };
        }
        if (!rule.enum.includes(value)) {
          return { valid: false, error: `Must be one of: ${rule.enum.join(", ")}` };
        }
        return { valid: true };
      }

      default:
        return { valid: false, error: "Unknown validation type" };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation error",
    };
  }
}

/**
 * Validate template values before applying
 */
export async function validateTemplateValues(
  request: ValidateTemplateRequest
): Promise<KernelEnvelope<TemplateValidationResult>> {
  try {
    const template = getTemplateById(request.templateId);

    if (!template) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: `Template not found: ${request.templateId}`,
      });
    }

    const errors: Record<string, string> = {};

    // Validate each field
    for (const field of template.configs) {
      const value = request.values[field.key];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === "")) {
        errors[field.key] = "This field is required";
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!field.required && (value === undefined || value === null || value === "")) {
        continue;
      }

      // Validate the value
      const validation = validateValue(value, field.validation);
      if (!validation.valid) {
        errors[field.key] = validation.error || "Invalid value";
      }
    }

    const result: TemplateValidationResult = {
      valid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };

    return kernelOk(result);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to validate template values",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Apply a template with user-provided values
 */
export async function applyTemplate(
  request: ApplyTemplateRequest,
  { db }: ConfigTemplateDeps
): Promise<KernelEnvelope<{ applied: number; failed: number }>> {
  try {
    const template = getTemplateById(request.templateId);

    if (!template) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: `Template not found: ${request.templateId}`,
      });
    }

    // Validate values first
    const validation = await validateTemplateValues({
      templateId: request.templateId,
      values: request.values,
    });

    if (!validation.ok) {
      return validation as KernelEnvelope<never>;
    }

    if (!validation.data.valid) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.VALIDATION,
        message: "Template validation failed",
        details: validation.data.errors,
      });
    }

    // Apply each configuration
    let applied = 0;
    let failed = 0;

    for (const field of template.configs) {
      const value = request.values[field.key];

      // Use provided value or default
      const finalValue = value !== undefined ? value : field.value;

      // Determine scope from template category
      let scope = "global";
      if (template.category === "Tenant") {
        scope = "tenant";
      } else if (template.category === "Service") {
        scope = "service";
      }

      // Build full key with scope
      const fullKey = `${scope}.${field.key}`;

      // Set the configuration
      const result = await setConfig(
        { db },
        {
          key: fullKey,
          value: finalValue,
        }
      );

      if (result.ok) {
        applied++;
      } else {
        failed++;
      }
    }

    return kernelOk({ applied, failed });
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to apply template",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Apply a preset (multiple templates)
 */
export async function applyPreset(
  presetId: string,
  { db }: ConfigTemplateDeps
): Promise<KernelEnvelope<{ applied: number; failed: number }>> {
  try {
    const preset = getPresetById(presetId);

    if (!preset) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: `Preset not found: ${presetId}`,
      });
    }

    let totalApplied = 0;
    let totalFailed = 0;

    // Apply each template in the preset
    for (const templateId of preset.templates) {
      const template = getTemplateById(templateId);
      if (!template) {
        totalFailed++;
        continue;
      }

      // Build default values from template
      const values: Record<string, unknown> = {};
      for (const field of template.configs) {
        values[field.key] = field.value;
      }

      // Apply template with default values
      const result = await applyTemplate(
        { templateId, values },
        { db }
      );

      if (result.ok) {
        totalApplied += result.data.applied;
        totalFailed += result.data.failed;
      } else {
        totalFailed++;
      }
    }

    return kernelOk({ applied: totalApplied, failed: totalFailed });
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to apply preset",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
