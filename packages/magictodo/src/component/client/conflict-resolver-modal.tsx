/**
 * @domain magictodo
 * @layer ui
 * @responsibility Multi-device edit conflict resolution
 * Conflict Resolver Modal - Shows local vs remote changes and allows user to merge/keep/discard
 */

"use client"

import { useState, useMemo, useEffect, type ReactNode } from "react"
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
} from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { ScrollArea } from "@afenda/shadcn"
import { RadioGroup, RadioGroupItem } from "@afenda/shadcn"
import { Label } from "@afenda/shadcn"
import { Separator } from "@afenda/shadcn"
import {
  AlertTriangle,
  Monitor,
  Cloud,
  GitMerge,
  Check,
  X,
  Clock,
  User,
  ArrowRight,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"

// ============ Types ============
export interface ConflictField {
  key: string
  label: string
  localValue: unknown
  remoteValue: unknown
  baseValue?: unknown // Original value before either change
  type: "string" | "number" | "boolean" | "date" | "array" | "object"
}

export interface ConflictData {
  id: string
  entityType: "task" | "project" | "comment" | "attachment"
  entityName: string
  fields: ConflictField[]
  localTimestamp: Date
  remoteTimestamp: Date
  localAuthor?: string
  remoteAuthor?: string
}

export type ResolutionStrategy = "keep-local" | "keep-remote" | "merge" | "custom"

export interface FieldResolution {
  key: string
  choice: "local" | "remote"
}

export interface ConflictResolution {
  id: string
  strategy: ResolutionStrategy
  fieldResolutions: FieldResolution[]
  resolvedData: Record<string, unknown>
}

interface ConflictResolverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflict: ConflictData | null
  onResolve: (resolution: ConflictResolution) => Promise<void>
  onCancel?: () => void
}

// ============ Helpers ============
function formatValue(value: unknown, type: ConflictField["type"]): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">Empty</span>
  }

  switch (type) {
    case "date":
      return value instanceof Date
        ? value.toLocaleString()
        : new Date(value as string).toLocaleString()
    case "boolean":
      return value ? (
        <Badge variant="outline" className="bg-green-500/10 text-green-600">
          <Check className="h-3 w-3 mr-1" />
          Yes
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-red-500/10 text-red-600">
          <X className="h-3 w-3 mr-1" />
          No
        </Badge>
      )
    case "array":
      const arr = value as unknown[]
      return arr.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {arr.slice(0, 5).map((item, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {String(item)}
            </Badge>
          ))}
          {arr.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{arr.length - 5} more
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground italic">None</span>
      )
    case "object":
      return (
        <pre className="text-xs bg-muted p-2 rounded max-w-xs overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    default:
      const strValue = String(value)
      return strValue.length > 100 ? (
        <span title={strValue}>{strValue.slice(0, 100)}...</span>
      ) : (
        strValue
      )
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function valuesAreEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => valuesAreEqual(v, b[i]))
  }
  if (typeof a === "object" && a !== null && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  return false
}

// ============ Field Comparison Component ============
interface FieldComparisonProps {
  field: ConflictField
  selected: "local" | "remote"
  onSelect: (choice: "local" | "remote") => void
}

function FieldComparison({ field, selected, onSelect }: FieldComparisonProps) {
  const hasConflict = !valuesAreEqual(field.localValue, field.remoteValue)

  if (!hasConflict) {
    return null
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{field.label}</h4>
        {hasConflict && (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/50">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Conflict
          </Badge>
        )}
      </div>

      <RadioGroup
        value={selected}
        onValueChange={(v) => onSelect(v as "local" | "remote")}
        className="space-y-3"
      >
        {/* Local Version */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-md border-2 transition-colors cursor-pointer",
            selected === "local"
              ? "border-primary bg-primary/5"
              : "border-transparent bg-muted/50 hover:bg-muted"
          )}
          onClick={() => onSelect("local")}
        >
          <RadioGroupItem value="local" id={`${field.key}-local`} className="mt-1" />
          <div className="flex-1 min-w-0">
            <Label
              htmlFor={`${field.key}-local`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Monitor className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Your changes</span>
            </Label>
            <div className="mt-2 text-sm">
              {formatValue(field.localValue, field.type)}
            </div>
          </div>
        </div>

        {/* Remote Version */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-md border-2 transition-colors cursor-pointer",
            selected === "remote"
              ? "border-primary bg-primary/5"
              : "border-transparent bg-muted/50 hover:bg-muted"
          )}
          onClick={() => onSelect("remote")}
        >
          <RadioGroupItem value="remote" id={`${field.key}-remote`} className="mt-1" />
          <div className="flex-1 min-w-0">
            <Label
              htmlFor={`${field.key}-remote`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Cloud className="h-4 w-4 text-green-500" />
              <span className="font-medium">Server version</span>
            </Label>
            <div className="mt-2 text-sm">
              {formatValue(field.remoteValue, field.type)}
            </div>
          </div>
        </div>
      </RadioGroup>
    </div>
  )
}

// ============ Main Modal Component ============
export function ConflictResolverModal({
  open,
  onOpenChange,
  conflict,
  onResolve,
  onCancel,
}: ConflictResolverModalProps) {
  const [resolving, setResolving] = useState(false)
  const [fieldChoices, setFieldChoices] = useState<Record<string, "local" | "remote">>({})

  // Initialize field choices when conflict changes
  const conflictingFields = useMemo(() => {
    if (!conflict) return []
    return conflict.fields.filter(
      (f) => !valuesAreEqual(f.localValue, f.remoteValue)
    )
  }, [conflict])

  // Initialize all choices to "local" by default (moved from useMemo to useEffect)
  useEffect(() => {
    if (conflictingFields.length > 0) {
      setFieldChoices((prev) => {
        const initial: Record<string, "local" | "remote"> = {}
        let hasNewFields = false
        conflictingFields.forEach((f) => {
          if (!(f.key in prev)) {
            initial[f.key] = "local"
            hasNewFields = true
          }
        })
        return hasNewFields ? { ...initial, ...prev } : prev
      })
    }
  }, [conflictingFields])

  const handleFieldChoice = (key: string, choice: "local" | "remote") => {
    setFieldChoices((prev) => ({ ...prev, [key]: choice }))
  }

  const handleKeepLocal = async () => {
    if (!conflict) return
    setResolving(true)
    try {
      const resolvedData: Record<string, unknown> = {}
      conflict.fields.forEach((f) => {
        resolvedData[f.key] = f.localValue
      })

      await onResolve({
        id: conflict.id,
        strategy: "keep-local",
        fieldResolutions: conflict.fields.map((f) => ({
          key: f.key,
          choice: "local",
        })),
        resolvedData,
      })
      onOpenChange(false)
    } finally {
      setResolving(false)
    }
  }

  const handleKeepRemote = async () => {
    if (!conflict) return
    setResolving(true)
    try {
      const resolvedData: Record<string, unknown> = {}
      conflict.fields.forEach((f) => {
        resolvedData[f.key] = f.remoteValue
      })

      await onResolve({
        id: conflict.id,
        strategy: "keep-remote",
        fieldResolutions: conflict.fields.map((f) => ({
          key: f.key,
          choice: "remote",
        })),
        resolvedData,
      })
      onOpenChange(false)
    } finally {
      setResolving(false)
    }
  }

  const handleMerge = async () => {
    if (!conflict) return
    setResolving(true)
    try {
      const resolvedData: Record<string, unknown> = {}
      const fieldResolutions: FieldResolution[] = []

      conflict.fields.forEach((f) => {
        const choice = fieldChoices[f.key] || "local"
        resolvedData[f.key] = choice === "local" ? f.localValue : f.remoteValue
        fieldResolutions.push({ key: f.key, choice })
      })

      await onResolve({
        id: conflict.id,
        strategy: "merge",
        fieldResolutions,
        resolvedData,
      })
      onOpenChange(false)
    } finally {
      setResolving(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  if (!conflict) return null

  return (
    <ClientDialog open={open} onOpenChange={onOpenChange}>
      <ClientDialogContent className="max-w-2xl max-h-[85vh]">
        <ClientDialogHeader>
          <ClientDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Conflict Detected
          </ClientDialogTitle>
          <ClientDialogDescription>
            This {conflict.entityType} was modified on another device while you were editing.
            Choose how to resolve the conflict.
          </ClientDialogDescription>
        </ClientDialogHeader>

        {/* Conflict Info Header */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <Monitor className="h-6 w-6 mx-auto text-blue-500" />
              <p className="text-xs font-medium mt-1">Your changes</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {formatTimestamp(conflict.localTimestamp)}
              </p>
              {conflict.localAuthor && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {conflict.localAuthor}
                </p>
              )}
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <GitMerge className="h-8 w-8 text-purple-500" />
            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            <div className="text-center">
              <Cloud className="h-6 w-6 mx-auto text-green-500" />
              <p className="text-xs font-medium mt-1">Server version</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {formatTimestamp(conflict.remoteTimestamp)}
              </p>
              {conflict.remoteAuthor && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {conflict.remoteAuthor}
                </p>
              )}
            </div>
          </div>

          <Badge variant="outline" className="shrink-0">
            {conflictingFields.length} conflicting field{conflictingFields.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <Separator />

        {/* Field Comparisons */}
        <ScrollArea className="max-h-80">
          <div className="space-y-4 pr-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Resolve each field</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const choices: Record<string, "local" | "remote"> = {}
                    conflictingFields.forEach((f) => {
                      choices[f.key] = "local"
                    })
                    setFieldChoices(choices)
                  }}
                >
                  Select all local
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const choices: Record<string, "local" | "remote"> = {}
                    conflictingFields.forEach((f) => {
                      choices[f.key] = "remote"
                    })
                    setFieldChoices(choices)
                  }}
                >
                  Select all remote
                </Button>
              </div>
            </div>

            {conflictingFields.map((field) => (
              <FieldComparison
                key={field.key}
                field={field}
                selected={fieldChoices[field.key] || "local"}
                onSelect={(choice) => handleFieldChoice(field.key, choice)}
              />
            ))}

            {conflictingFields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No conflicting fields detected.</p>
                <p className="text-sm">The changes can be merged automatically.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <ClientDialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button variant="outline" onClick={handleCancel} disabled={resolving}>
              Cancel
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleKeepRemote}
              disabled={resolving}
              className="gap-2"
            >
              <Cloud className="h-4 w-4" />
              Keep server
            </Button>
            <Button
              variant="outline"
              onClick={handleKeepLocal}
              disabled={resolving}
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              Keep mine
            </Button>
            <Button onClick={handleMerge} disabled={resolving} className="gap-2">
              <GitMerge className="h-4 w-4" />
              Merge selected
            </Button>
          </div>
        </ClientDialogFooter>
      </ClientDialogContent>
    </ClientDialog>
  )
}

// ============ Hook for Conflict Detection ============
export function useConflictDetection() {
  const [conflict, setConflict] = useState<ConflictData | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const detectConflict = (
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>,
    options: {
      entityType: ConflictData["entityType"]
      entityName: string
      localTimestamp: Date
      remoteTimestamp: Date
      fieldConfig: Array<{ key: string; label: string; type: ConflictField["type"] }>
    }
  ): boolean => {
    const fields: ConflictField[] = options.fieldConfig.map((config) => ({
      ...config,
      localValue: localData[config.key],
      remoteValue: remoteData[config.key],
    }))

    const hasConflict = fields.some(
      (f) => !valuesAreEqual(f.localValue, f.remoteValue)
    )

    if (hasConflict) {
      setConflict({
        id: `conflict-${Date.now()}`,
        entityType: options.entityType,
        entityName: options.entityName,
        fields,
        localTimestamp: options.localTimestamp,
        remoteTimestamp: options.remoteTimestamp,
      })
      setIsOpen(true)
    }

    return hasConflict
  }

  const clearConflict = () => {
    setConflict(null)
    setIsOpen(false)
  }

  return {
    conflict,
    isOpen,
    setIsOpen,
    detectConflict,
    clearConflict,
  }
}
