/**
 * @layer domain (magicdrive)
 * @responsibility Search input component.
 */

"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@afenda/shared/utils"

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search documents...",
  className,
  autoFocus,
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full h-9 pl-9 pr-8 rounded-md border border-input bg-background text-sm",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      />
      {value && (
        <button
          onClick={() => {
            onChange("")
            inputRef.current?.focus()
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
