"use client"

/**
 * @domain shared
 * @layer ui
 * @responsibility Custom/extended date-picker component - Enhanced UI functionality
 * @owner afenda/shadcn
 * @dependencies
 * - shadcn/ui components
 * - @/lib/utils
 * @exports
 * - date-picker component
 */

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "../button"
import { Calendar } from "../calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../popover"

type DatePickerValue = Date | undefined

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value)
}

function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date",
  disabled = false,
  buttonClassName,
  contentClassName,
  calendarProps,
}: {
  value?: DatePickerValue
  defaultValue?: DatePickerValue
  onValueChange?: (value: DatePickerValue) => void
  placeholder?: string
  disabled?: boolean
  buttonClassName?: string
  contentClassName?: string
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect"
  >
}) {
  const [uncontrolled, setUncontrolled] = React.useState<DatePickerValue>(
    defaultValue
  )

  const selected = value ?? uncontrolled

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={disabled}
          className={cn(
            "justify-start font-normal",
            !selected && "text-muted-foreground",
            buttonClassName
          )}
        >
          <CalendarIcon className="size-4" />
          {selected ? formatDate(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", contentClassName)} align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(next) => {
            if (value === undefined) setUncontrolled(next)
            onValueChange?.(next)
          }}
          initialFocus
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }

