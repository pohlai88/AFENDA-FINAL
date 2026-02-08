/**
 * @domain magictodo
 * @layer ui
 * @responsibility Form component for creating/editing custom field definitions
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
} from "@afenda/shadcn"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@afenda/shadcn"
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Textarea } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Switch } from "@afenda/shadcn"
import { Separator } from "@afenda/shadcn"
import {
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  Clock,
  List,
  ChevronDown,
  Plus,
  X,
  Loader2,
  GripVertical,
} from "lucide-react"
import { toast } from "sonner"
import {
  FIELD_TYPE,
  FIELD_ALIAS_MAP,
  type FieldType,
  type FieldDefinitionResponse,
  type CreateFieldDefinitionRequest,
  type FieldValidation,
} from "@afenda/magictodo/zod"

// ============ Form Schema ============
const fieldFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  fieldType: z.enum([
    FIELD_TYPE.TEXT,
    FIELD_TYPE.NUMBER,
    FIELD_TYPE.BOOLEAN,
    FIELD_TYPE.DATE,
    FIELD_TYPE.TIMESTAMP,
    FIELD_TYPE.JSON,
    FIELD_TYPE.SELECT,
  ]),
  alias: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  required: z.boolean().optional(),
  multiline: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    color: z.string().optional(),
  })).optional(),
})

type FieldFormValues = z.infer<typeof fieldFormSchema>

// ============ Props ============
interface FieldDefinitionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Existing field for edit mode, null for create */
  field?: FieldDefinitionResponse | null
  onSubmit: (data: CreateFieldDefinitionRequest) => Promise<void>
}

// ============ Field Type Icons ============
const FIELD_TYPE_ICONS: Record<FieldType, typeof Type> = {
  [FIELD_TYPE.TEXT]: Type,
  [FIELD_TYPE.NUMBER]: Hash,
  [FIELD_TYPE.BOOLEAN]: ToggleLeft,
  [FIELD_TYPE.DATE]: Calendar,
  [FIELD_TYPE.TIMESTAMP]: Clock,
  [FIELD_TYPE.JSON]: List,
  [FIELD_TYPE.SELECT]: ChevronDown,
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FIELD_TYPE.TEXT]: "Text",
  [FIELD_TYPE.NUMBER]: "Number",
  [FIELD_TYPE.BOOLEAN]: "Boolean",
  [FIELD_TYPE.DATE]: "Date",
  [FIELD_TYPE.TIMESTAMP]: "Date & Time",
  [FIELD_TYPE.JSON]: "JSON / List",
  [FIELD_TYPE.SELECT]: "Select / Dropdown",
}

// ============ Component ============
export function FieldDefinitionForm({
  open,
  onOpenChange,
  field,
  onSubmit,
}: FieldDefinitionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = !!field

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: "",
      fieldType: FIELD_TYPE.TEXT,
      alias: "",
      description: "",
      required: false,
      multiline: false,
      min: undefined,
      max: undefined,
      options: [],
    },
  })

  // Reset form when field changes
  useEffect(() => {
    if (field) {
      const validation = field.validation as FieldValidation
      form.reset({
        name: field.name,
        fieldType: field.fieldType,
        alias: field.alias ?? "",
        description: field.description ?? "",
        required: validation?.required ?? false,
        multiline: validation?.multiline ?? false,
        min: validation?.min,
        max: validation?.max,
        options: validation?.options ?? [],
      })
    } else {
      form.reset({
        name: "",
        fieldType: FIELD_TYPE.TEXT,
        alias: "",
        description: "",
        required: false,
        multiline: false,
        min: undefined,
        max: undefined,
        options: [],
      })
    }
  }, [field, form])

  const selectedType = form.watch("fieldType")
  const options = form.watch("options") ?? []

  const handleAddOption = useCallback(() => {
    const current = form.getValues("options") ?? []
    form.setValue("options", [
      ...current,
      { value: `option_${current.length + 1}`, label: `Option ${current.length + 1}` },
    ])
  }, [form])

  const handleRemoveOption = useCallback(
    (index: number) => {
      const current = form.getValues("options") ?? []
      form.setValue(
        "options",
        current.filter((_, i) => i !== index)
      )
    },
    [form]
  )

  const handleSubmit = async (values: FieldFormValues) => {
    setIsSubmitting(true)
    try {
      const validation: FieldValidation = {
        required: values.required,
        multiline: values.multiline,
      }
      if (values.min !== undefined) validation.min = values.min
      if (values.max !== undefined) validation.max = values.max
      if (values.options && values.options.length > 0) validation.options = values.options

      const data: CreateFieldDefinitionRequest = {
        name: values.name,
        fieldType: values.fieldType,
        alias: values.alias || undefined,
        description: values.description || undefined,
        validation,
      }

      await onSubmit(data)
      onOpenChange(false)
      toast.success(isEdit ? "Field updated" : "Field created")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save field")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ClientDialog open={open} onOpenChange={onOpenChange}>
      <ClientDialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <ClientDialogHeader>
          <ClientDialogTitle>{isEdit ? "Edit Field" : "Add Custom Field"}</ClientDialogTitle>
          <ClientDialogDescription>
            {isEdit
              ? "Update the field definition settings"
              : "Create a new custom field for your tasks"}
          </ClientDialogDescription>
        </ClientDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Field Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Priority Level" {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this field
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Type */}
            <FormField
              control={form.control}
              name="fieldType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Type *</FormLabel>
                  <ClientSelect
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <ClientSelectTrigger>
                        <ClientSelectValue placeholder="Select field type" />
                      </ClientSelectTrigger>
                    </FormControl>
                    <ClientSelectContent>
                      {Object.entries(FIELD_TYPE_LABELS).map(([type, label]) => {
                        const Icon = FIELD_TYPE_ICONS[type as FieldType]
                        return (
                          <ClientSelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              {label}
                            </div>
                          </ClientSelectItem>
                        )
                      })}
                    </ClientSelectContent>
                  </ClientSelect>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Alias */}
            <FormField
              control={form.control}
              name="alias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Alias</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Long Text, Currency" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional display name (suggestions:{" "}
                    {FIELD_ALIAS_MAP[selectedType]?.aliases.slice(0, 3).join(", ")})
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this field is for..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Validation Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Validation</h4>

              {/* Required */}
              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Required</FormLabel>
                      <FormDescription className="text-xs">
                        This field must have a value
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Multiline (for text) */}
              {selectedType === FIELD_TYPE.TEXT && (
                <FormField
                  control={form.control}
                  name="multiline"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Multiline</FormLabel>
                        <FormDescription className="text-xs">
                          Allow multiple lines of text
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* Min/Max (for number) */}
              {selectedType === FIELD_TYPE.NUMBER && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Min value"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Max value"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Options (for select) */}
              {selectedType === FIELD_TYPE.SELECT && (
                <div className="space-y-2">
                  <FormLabel>Options</FormLabel>
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <Input
                          placeholder="Value"
                          value={option.value}
                          onChange={(e) => {
                            const updated = [...options]
                            updated[index] = { ...updated[index], value: e.target.value }
                            form.setValue("options", updated)
                          }}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Label"
                          value={option.label}
                          onChange={(e) => {
                            const updated = [...options]
                            updated[index] = { ...updated[index], label: e.target.value }
                            form.setValue("options", updated)
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <ClientDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Update Field"
                ) : (
                  "Create Field"
                )}
              </Button>
            </ClientDialogFooter>
          </form>
        </Form>
      </ClientDialogContent>
    </ClientDialog>
  )
}

export default FieldDefinitionForm
