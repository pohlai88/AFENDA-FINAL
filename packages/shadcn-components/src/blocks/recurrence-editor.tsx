"use client"

import { useState } from "react"
import { Calendar, Repeat, Plus, X } from "lucide-react"

import { Button } from "../button"
import { Input } from "../input"
import { Label } from "../label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select"
import { Card, CardContent, CardHeader, CardTitle } from "../card"
import { Checkbox } from "../checkbox"

/** Recurrence frequency options */
export type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "yearly"

/** Recurrence rule configuration */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number
  daysOfWeek: number[]
  daysOfMonth: number[]
  endDate?: string
  maxOccurrences?: number
}

interface RecurrenceEditorProps {
  value: RecurrenceRule | null
  onChange: (rule: RecurrenceRule | null) => void
  disabled?: boolean
}

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string; description: string }[] = [
  { value: "daily", label: "Daily", description: "Every day" },
  { value: "weekly", label: "Weekly", description: "Every week" },
  { value: "biweekly", label: "Bi-weekly", description: "Every 2 weeks" },
  { value: "monthly", label: "Monthly", description: "Every month" },
  { value: "yearly", label: "Yearly", description: "Every year" },
]

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))

export function RecurrenceEditor({ value, onChange, disabled = false }: RecurrenceEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFrequencyChange = (frequency: RecurrenceFrequency) => {
    if (!value) {
      onChange(null)
      return
    }

    const updatedRule: RecurrenceRule = {
      frequency,
      interval: 1,
      daysOfWeek: [],
      daysOfMonth: [],
    }
    onChange(updatedRule)
  }

  const handleIntervalChange = (interval: string) => {
    const num = parseInt(interval) || 1
    if (!value) return

    onChange({
      ...value,
      interval: num,
    })
  }

  const handleDayOfWeekToggle = (day: number) => {
    if (!value) return

    const currentDays = value.daysOfWeek || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d: number) => d !== day)
      : [...currentDays, day]

    onChange({
      ...value,
      daysOfWeek: newDays,
    })
  }

  const handleDayOfMonthToggle = (day: number) => {
    if (!value) return

    const currentDays = value.daysOfMonth || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d: number) => d !== day)
      : [...currentDays, day]

    onChange({
      ...value,
      daysOfMonth: newDays,
    })
  }

  const handleMaxOccurrencesChange = (maxOccurrences: string) => {
    const num = parseInt(maxOccurrences) || undefined
    if (!value) return

    onChange({
      ...value,
      maxOccurrences: num,
    })
  }

  const handleEndDateChange = (endDate: string) => {
    if (!value) return

    const date = endDate ? new Date(endDate).toISOString() : undefined
    onChange({
      ...value,
      endDate: date,
    })
  }

  const handleClearRecurrence = () => {
    onChange(null)
  }

  const getFrequencyLabel = (frequency: RecurrenceFrequency) => {
    const option = FREQUENCY_OPTIONS.find(opt => opt.value === frequency)
    return option?.label || frequency
  }

  const getWeekdayLabel = (day: number) => {
    const weekday = WEEKDAYS.find(d => d.value === day)
    return weekday?.label || `${day}`
  }

  const getMonthdayLabel = (day: number) => {
    return `${day}`
  }

  if (!value) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <Repeat className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">No recurrence set</p>
          <Button
            onClick={() =>
              onChange({
                frequency: "daily",
                interval: 1,
                daysOfWeek: [],
                daysOfMonth: [],
              })
            }
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Recurrence
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recurrence</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearRecurrence}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Frequency</Label>
            <Select
              value={value.frequency}
              onValueChange={handleFrequencyChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Repeat every</Label>
            <Input
              type="number"
              min="1"
              value={value.interval.toString()}
              onChange={(e) => handleIntervalChange(e.target.value)}
              disabled={disabled}
              placeholder="1"
            />
          </div>
        </div>

        {/* Frequency-specific Options */}
        {value.frequency === "weekly" && (
          <div className="space-y-2">
            <Label className="text-sm">On days</Label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => (
                <div key={day.value} className="flex flex-col items-center">
                  <Checkbox
                    id={`weekday-${day.value}`}
                    checked={value.daysOfWeek?.includes(day.value)}
                    onCheckedChange={() => handleDayOfWeekToggle(day.value)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`weekday-${day.value}`}
                    className="text-xs text-center"
                  >
                    {getWeekdayLabel(day.value)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {value.frequency === "monthly" && (
          <div className="space-y-2">
            <Label className="text-sm">On days of month</Label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
              {MONTH_DAYS.map((day) => (
                <div key={day.value} className="flex flex-col items-center">
                  <Checkbox
                    id={`monthday-${day.value}`}
                    checked={value.daysOfMonth?.includes(day.value)}
                    onCheckedChange={() => handleDayOfMonthToggle(day.value)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`monthday-${day.value}`}
                    className="text-xs text-center"
                  >
                    {getMonthdayLabel(day.value)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Options */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs"
          >
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </Button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Max occurrences</Label>
                <Input
                  type="number"
                  min="1"
                  value={value.maxOccurrences?.toString() || ""}
                  onChange={(e) => handleMaxOccurrencesChange(e.target.value)}
                  placeholder="No limit"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">End date (optional)</Label>
                <Input
                  type="date"
                  value={value.endDate ? new Date(value.endDate).toISOString().slice(0, 10) : ""}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted/30 rounded-md">
              <h4 className="text-sm font-medium mb-2">Preview:</h4>
              <div className="text-sm">
                {value.interval > 1 && (
                  <span>Every {value.interval} {getFrequencyLabel(value.frequency).toLowerCase()}</span>
                )}
                {value.frequency === "weekly" && (value.daysOfWeek || []).length > 0 && (
                  <span> on {(value.daysOfWeek || []).map(getWeekdayLabel).join(", ")}</span>
                )}
                {value.frequency === "monthly" && (value.daysOfMonth || []).length > 0 && (
                  <span> on {(value.daysOfMonth || []).map(getMonthdayLabel).join(", ")}</span>
                )}
                {value.endDate && (
                  <span> until {new Date(value.endDate).toLocaleDateString()}</span>
                )}
                {value.maxOccurrences && (
                  <> ({value.maxOccurrences} occurrences max)</>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {value.interval > 1 && (
              <>
                Every {value.interval} {getFrequencyLabel(value.frequency).toLowerCase()}
              </>
            )}
            {value.frequency === "weekly" && (value.daysOfWeek || []).length > 0 && (
              <>
                on {(value.daysOfWeek || []).map(getWeekdayLabel).join(", ")}
              </>
            )}
            {value.frequency === "monthly" && (value.daysOfMonth || []).length > 0 && (
              <>
                on {(value.daysOfMonth || []).map(getMonthdayLabel).join(", ")}
              </>
            )}
            {value.endDate && (
              <>
                until {new Date(value.endDate).toLocaleDateString()}
              </>
            )}
            {value.maxOccurrences && (
              <> ({value.maxOccurrences} occurrences max)</>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
