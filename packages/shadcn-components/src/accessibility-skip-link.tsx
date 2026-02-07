"use client"

/**
 * Skip to Content Link
 * Accessibility feature for keyboard navigation
 */

import * as React from "react"
import { cn } from "./lib/utils"

export interface SkipLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href?: string
  children?: React.ReactNode
}

export function SkipLink({
  href = "#main-content",
  children = "Skip to main content",
  className,
  ...props
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only",
        "fixed top-4 left-4 z-50",
        "bg-primary text-primary-foreground",
        "px-4 py-2 rounded-md",
        "font-medium text-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-all",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}
