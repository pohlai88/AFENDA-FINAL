/**
 * @domain magictodo
 * @layer contracts
 * @responsibility Zod schemas for custom field definitions and values
 */

import { z } from "zod"

// ============ Field Type Constants ============
export const FIELD_TYPE = {
  TEXT: "text",
  NUMBER: "number",
  BOOLEAN: "boolean",
  DATE: "date",
  TIMESTAMP: "timestamp",
  JSON: "json",
  SELECT: "select",
} as const

export const FieldType = z.enum([
  FIELD_TYPE.TEXT,
  FIELD_TYPE.NUMBER,
  FIELD_TYPE.BOOLEAN,
  FIELD_TYPE.DATE,
  FIELD_TYPE.TIMESTAMP,
  FIELD_TYPE.JSON,
  FIELD_TYPE.SELECT,
])
export type FieldType = z.infer<typeof FieldType>

// ============ Field Type Aliases (Display Names) ============
export const FIELD_ALIAS_MAP: Record<string, { type: FieldType; aliases: string[] }> = {
  [FIELD_TYPE.TEXT]: {
    type: FIELD_TYPE.TEXT,
    aliases: ["Short Text", "Title", "Name", "Long Text", "Description", "Notes"],
  },
  [FIELD_TYPE.NUMBER]: {
    type: FIELD_TYPE.NUMBER,
    aliases: ["Number", "Currency", "Percentage", "Rating", "Count"],
  },
  [FIELD_TYPE.BOOLEAN]: {
    type: FIELD_TYPE.BOOLEAN,
    aliases: ["Checkbox", "Toggle", "Yes/No", "Flag"],
  },
  [FIELD_TYPE.DATE]: {
    type: FIELD_TYPE.DATE,
    aliases: ["Date", "Due Date", "Start Date", "End Date"],
  },
  [FIELD_TYPE.TIMESTAMP]: {
    type: FIELD_TYPE.TIMESTAMP,
    aliases: ["DateTime", "Time Format", "Deadline", "Appointment"],
  },
  [FIELD_TYPE.JSON]: {
    type: FIELD_TYPE.JSON,
    aliases: ["Tags", "Multi-Select", "JSON", "List"],
  },
  [FIELD_TYPE.SELECT]: {
    type: FIELD_TYPE.SELECT,
    aliases: ["Dropdown", "Status", "Priority", "Category"],
  },
}

// ============ Validation Schema ============
export const fieldValidationSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional().describe("Min value for number, min length for text"),
  max: z.number().optional().describe("Max value for number, max length for text"),
  pattern: z.string().optional().describe("Regex pattern for text validation"),
  multiline: z.boolean().optional().describe("True for long text/textarea"),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    color: z.string().optional(),
  })).optional().describe("Options for select/dropdown fields"),
}).passthrough()

export type FieldValidation = z.infer<typeof fieldValidationSchema>

// ============ Field Definition Schemas ============
export const fieldDefinitionBaseSchema = z.object({
  name: z.string().min(1).max(100).describe("Field name (unique per org)"),
  fieldType: FieldType.describe("Canonical field type"),
  alias: z.string().max(100).optional().describe("Display alias (e.g., 'Long Text')"),
  description: z.string().max(500).optional(),
  validation: fieldValidationSchema.optional(),
  defaultValue: z.unknown().optional().describe("Default value for new tasks"),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export const createFieldDefinitionRequestSchema = fieldDefinitionBaseSchema

export const updateFieldDefinitionRequestSchema = fieldDefinitionBaseSchema.partial()

export const fieldDefinitionResponseSchema = fieldDefinitionBaseSchema.extend({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type CreateFieldDefinitionRequest = z.infer<typeof createFieldDefinitionRequestSchema>
export type UpdateFieldDefinitionRequest = z.infer<typeof updateFieldDefinitionRequestSchema>
export type FieldDefinitionResponse = z.infer<typeof fieldDefinitionResponseSchema>

// ============ Field Definition List Response ============
export const fieldDefinitionListResponseSchema = z.object({
  items: z.array(fieldDefinitionResponseSchema),
  total: z.number(),
})

export type FieldDefinitionListResponse = z.infer<typeof fieldDefinitionListResponseSchema>

// ============ Field Value Schemas ============
export const fieldValueBaseSchema = z.object({
  fieldDefinitionId: z.string().uuid(),
  // Polymorphic value - only one should be set based on field type
  textValue: z.string().nullable().optional(),
  numberValue: z.number().nullable().optional(),
  booleanValue: z.boolean().nullable().optional(),
  dateValue: z.string().datetime().nullable().optional(),
  timestampValue: z.string().datetime().nullable().optional(),
  jsonValue: z.unknown().nullable().optional(),
})

export const setFieldValueRequestSchema = z.object({
  fieldDefinitionId: z.string().uuid(),
  value: z.unknown().describe("Value matching the field type"),
})

export const fieldValueResponseSchema = fieldValueBaseSchema.extend({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type SetFieldValueRequest = z.infer<typeof setFieldValueRequestSchema>
export type FieldValueResponse = z.infer<typeof fieldValueResponseSchema>

// ============ Field Values List Response ============
export const fieldValuesListResponseSchema = z.object({
  items: z.array(fieldValueResponseSchema),
  total: z.number(),
})

export type FieldValuesListResponse = z.infer<typeof fieldValuesListResponseSchema>

// ============ Bulk Set Field Values ============
export const bulkSetFieldValuesRequestSchema = z.object({
  values: z.array(setFieldValueRequestSchema),
})

export type BulkSetFieldValuesRequest = z.infer<typeof bulkSetFieldValuesRequestSchema>

// ============ Params Schemas ============
export const fieldDefinitionParamsSchema = z.object({
  id: z.string().uuid(),
})

export type FieldDefinitionParams = z.infer<typeof fieldDefinitionParamsSchema>

// ============ Reorder Request ============
export const reorderFieldDefinitionsRequestSchema = z.object({
  orderedIds: z.array(z.string().uuid()).describe("Field definition IDs in desired order"),
})

export type ReorderFieldDefinitionsRequest = z.infer<typeof reorderFieldDefinitionsRequestSchema>

// ============ Helper: Get Value from Polymorphic Storage ============
export function extractFieldValue(
  value: FieldValueResponse,
  fieldType: FieldType
): unknown {
  switch (fieldType) {
    case FIELD_TYPE.TEXT:
      return value.textValue
    case FIELD_TYPE.NUMBER:
      return value.numberValue
    case FIELD_TYPE.BOOLEAN:
      return value.booleanValue
    case FIELD_TYPE.DATE:
      return value.dateValue
    case FIELD_TYPE.TIMESTAMP:
      return value.timestampValue
    case FIELD_TYPE.JSON:
    case FIELD_TYPE.SELECT:
      return value.jsonValue
    default:
      return null
  }
}

// ============ Helper: Build Polymorphic Value Object ============
export function buildFieldValueObject(
  fieldType: FieldType,
  value: unknown
): Partial<FieldValueResponse> {
  const base = {
    textValue: null,
    numberValue: null,
    booleanValue: null,
    dateValue: null,
    timestampValue: null,
    jsonValue: null,
  }

  switch (fieldType) {
    case FIELD_TYPE.TEXT:
      return { ...base, textValue: value as string }
    case FIELD_TYPE.NUMBER:
      return { ...base, numberValue: value as number }
    case FIELD_TYPE.BOOLEAN:
      return { ...base, booleanValue: value as boolean }
    case FIELD_TYPE.DATE:
      return { ...base, dateValue: value as string }
    case FIELD_TYPE.TIMESTAMP:
      return { ...base, timestampValue: value as string }
    case FIELD_TYPE.JSON:
    case FIELD_TYPE.SELECT:
      return { ...base, jsonValue: value }
    default:
      return base
  }
}
