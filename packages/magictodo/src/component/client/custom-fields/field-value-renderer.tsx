/* eslint-disable react-hooks/error-boundaries -- try/catch wraps date parsing, not component rendering */
/**
 * @domain magictodo
 * @layer ui
 * @responsibility Dynamic component to render and edit custom field values
 */

"use client"

import { useState, useCallback } from "react"
import { format } from "date-fns"
import { Input } from "@afenda/shadcn"
import { Textarea } from "@afenda/shadcn"
import { Switch } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Calendar } from "@afenda/shadcn"
import {
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
} from "@afenda/shadcn"
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn"
import {
  CalendarIcon,
  Check,
  X,
  Pencil,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"
import {
  FIELD_TYPE,
  type FieldType,
  type FieldDefinitionResponse,
  type FieldValidation,
  extractFieldValue,
  type FieldValueResponse,
} from "@afenda/magictodo/zod"

// ============ Props ============
interface FieldValueRendererProps {
  definition: FieldDefinitionResponse
  value?: FieldValueResponse | null
  readOnly?: boolean
  onChange?: (value: unknown) => void
  className?: string
}

interface FieldValueDisplayProps {
  definition: FieldDefinitionResponse
  value: unknown
  className?: string
}

interface FieldValueEditorProps {
  definition: FieldDefinitionResponse
  value: unknown
  onChange: (value: unknown) => void
  onBlur?: () => void
  className?: string
}

// ============ Display Component (Read-only) ============
export function FieldValueDisplay({
  definition,
  value,
  className,
}: FieldValueDisplayProps) {
  const { fieldType, alias: _alias, validation } = definition
  const validationRules = validation as FieldValidation

  if (value === null || value === undefined) {
    return (
      <span className={cn("text-muted-foreground italic text-sm", className)}>
        —
      </span>
    )
  }

  switch (fieldType) {
    case FIELD_TYPE.TEXT:
      return (
        <span className={cn("text-sm", className)}>
          {validationRules?.multiline ? (
            <span className="whitespace-pre-wrap">{String(value)}</span>
          ) : (
            String(value)
          )}
        </span>
      )

    case FIELD_TYPE.NUMBER:
      return (
        <span className={cn("text-sm font-mono", className)}>
          {typeof value === "number" ? value.toLocaleString() : String(value)}
        </span>
      )

    case FIELD_TYPE.BOOLEAN:
      return value ? (
        <Badge variant="default" className="bg-green-500">
          <Check className="h-3 w-3 mr-1" />
          Yes
        </Badge>
      ) : (
        <Badge variant="secondary">
          <X className="h-3 w-3 mr-1" />
          No
        </Badge>
      )

    case FIELD_TYPE.DATE:
      try {
        const date = new Date(String(value))
        return (
          <span className={cn("text-sm", className)}>
            {format(date, "PP")}
          </span>
        )
      } catch {
        return <span className="text-sm text-destructive">Invalid date</span>
      }

    case FIELD_TYPE.TIMESTAMP:
      try {
        const date = new Date(String(value))
        return (
          <span className={cn("text-sm", className)}>
            {format(date, "PPp")}
          </span>
        )
      } catch {
        return <span className="text-sm text-destructive">Invalid date</span>
      }

    case FIELD_TYPE.SELECT:
      const options = validationRules?.options ?? []
      const selectedOption = options.find((o) => o.value === value)
      return (
        <Badge
          variant="outline"
          style={
            selectedOption?.color
              ? { borderColor: selectedOption.color, color: selectedOption.color }
              : undefined
          }
        >
          {selectedOption?.label ?? String(value)}
        </Badge>
      )

    case FIELD_TYPE.JSON:
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((item, i) => (
              <Badge key={i} variant="secondary">
                {String(item)}
              </Badge>
            ))}
          </div>
        )
      }
      return (
        <span className={cn("text-sm font-mono text-xs", className)}>
          {JSON.stringify(value)}
        </span>
      )

    default:
      return <span className="text-sm">{String(value)}</span>
  }
}

// ============ Editor Component ============
export function FieldValueEditor({
  definition,
  value,
  onChange,
  onBlur,
  className,
}: FieldValueEditorProps) {
  const { fieldType, validation } = definition
  const validationRules = validation as FieldValidation

  switch (fieldType) {
    case FIELD_TYPE.TEXT:
      if (validationRules?.multiline) {
        return (
          <Textarea
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={cn("resize-none", className)}
            rows={3}
            minLength={validationRules?.min}
            maxLength={validationRules?.max}
          />
        )
      }
      return (
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={className}
          minLength={validationRules?.min}
          maxLength={validationRules?.max}
        />
      )

    case FIELD_TYPE.NUMBER:
      return (
        <Input
          type="number"
          value={value !== null && value !== undefined ? Number(value) : ""}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : null)
          }
          onBlur={onBlur}
          className={cn("font-mono", className)}
          min={validationRules?.min}
          max={validationRules?.max}
        />
      )

    case FIELD_TYPE.BOOLEAN:
      return (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={onChange}
          className={className}
        />
      )

    case FIELD_TYPE.DATE:
      return (
        <ClientPopover>
          <ClientPopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                className
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(String(value)), "PP") : "Pick a date"}
            </Button>
          </ClientPopoverTrigger>
          <ClientPopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? new Date(String(value)) : undefined}
              onSelect={(date) => onChange(date?.toISOString() ?? null)}
              initialFocus
            />
          </ClientPopoverContent>
        </ClientPopover>
      )

    case FIELD_TYPE.TIMESTAMP:
      // For timestamp, show date picker + time input
      const dateValue = value ? new Date(String(value)) : null
      return (
        <div className="flex gap-2">
          <ClientPopover>
            <ClientPopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "PP") : "Date"}
              </Button>
            </ClientPopoverTrigger>
            <ClientPopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue ?? undefined}
                onSelect={(date) => {
                  if (date) {
                    const existing = dateValue ?? new Date()
                    date.setHours(existing.getHours(), existing.getMinutes())
                    onChange(date.toISOString())
                  } else {
                    onChange(null)
                  }
                }}
                initialFocus
              />
            </ClientPopoverContent>
          </ClientPopover>
          <Input
            type="time"
            value={dateValue ? format(dateValue, "HH:mm") : ""}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(":").map(Number)
              const date = dateValue ?? new Date()
              date.setHours(hours ?? 0, minutes ?? 0)
              onChange(date.toISOString())
            }}
            className="w-24"
          />
        </div>
      )

    case FIELD_TYPE.SELECT:
      const options = validationRules?.options ?? []
      return (
        <ClientSelect
          value={String(value ?? "")}
          onValueChange={onChange}
        >
          <ClientSelectTrigger className={className}>
            <ClientSelectValue placeholder="Select..." />
          </ClientSelectTrigger>
          <ClientSelectContent>
            {options.map((option) => (
              <ClientSelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.label}
                </div>
              </ClientSelectItem>
            ))}
          </ClientSelectContent>
        </ClientSelect>
      )

    case FIELD_TYPE.JSON:
      // For JSON/list, show a simple textarea for now
      return (
        <Textarea
          value={
            typeof value === "string" ? value : JSON.stringify(value ?? [], null, 2)
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              onChange(parsed)
            } catch {
              // Keep as string if invalid JSON
              onChange(e.target.value)
            }
          }}
          onBlur={onBlur}
          className={cn("font-mono text-xs resize-none", className)}
          rows={3}
        />
      )

    default:
      return (
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={className}
        />
      )
  }
}

// ============ Combined Renderer (View + Edit) ============
export function FieldValueRenderer({
  definition,
  value,
  readOnly = false,
  onChange,
  className,
}: FieldValueRendererProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState<unknown>(null)

  // Extract actual value from polymorphic storage
  const actualValue = value
    ? extractFieldValue(value, definition.fieldType as FieldType)
    : null

  const handleStartEdit = useCallback(() => {
    if (readOnly) return
    setLocalValue(actualValue)
    setIsEditing(true)
  }, [readOnly, actualValue])

  const handleChange = useCallback((newValue: unknown) => {
    setLocalValue(newValue)
  }, [])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    if (onChange && localValue !== actualValue) {
      onChange(localValue)
    }
  }, [onChange, localValue, actualValue])

  if (readOnly) {
    return (
      <FieldValueDisplay
        definition={definition}
        value={actualValue}
        className={className}
      />
    )
  }

  if (isEditing) {
    return (
      <FieldValueEditor
        definition={definition}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className={cn(
        "group flex items-center gap-2 text-left hover:bg-muted/50 rounded px-2 py-1 -mx-2",
        className
      )}
    >
      <FieldValueDisplay definition={definition} value={actualValue} />
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  )
}

export default FieldValueRenderer
