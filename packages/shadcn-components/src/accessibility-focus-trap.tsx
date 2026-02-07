"use client"

/**
 * Focus Trap Hook
 * Traps focus within a container for modals and dialogs
 */

import * as React from "react"

export interface UseFocusTrapOptions {
  enabled?: boolean
  initialFocus?: React.RefObject<HTMLElement>
  returnFocus?: boolean
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, initialFocus, returnFocus = true } = options
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus initial element or first focusable element
    const focusInitial = () => {
      if (initialFocus?.current) {
        initialFocus.current.focus()
      } else {
        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length > 0) {
          focusableElements[0].focus()
        }
      }
    }

    focusInitial()

    // Handle tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return

      const focusableElements = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown)

    return () => {
      container.removeEventListener("keydown", handleKeyDown)
      
      // Return focus to previous element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [enabled, containerRef, initialFocus, returnFocus])
}
