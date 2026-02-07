"use client"

/**
 * @domain shared
 * @layer ui
 * @responsibility Custom/extended password-input component - Enhanced UI functionality
 * @owner afenda/shadcn
 * @dependencies
 * - shadcn/ui components
 * - @/lib/utils
 * @exports
 * - password-input component
 */

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "../button"
import { Input } from "../input"

export interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** Accessibility label for show/hide button when password is hidden */
  showPasswordLabel?: string
  /** Accessibility label for show/hide button when password is visible */
  hidePasswordLabel?: string
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      showPasswordLabel = "Show password",
      hidePasswordLabel = "Hide password",
      ...props
    },
    ref
  ) => {
    const [show, setShow] = React.useState(false)

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
          aria-label={show ? hidePasswordLabel : showPasswordLabel}
          onClick={() => setShow((prev) => !prev)}
          tabIndex={-1}
        >
          {show ? (
            <EyeOff className="size-4 shrink-0" aria-hidden />
          ) : (
            <Eye className="size-4 shrink-0" aria-hidden />
          )}
        </Button>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
