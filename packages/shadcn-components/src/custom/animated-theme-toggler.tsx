"use client"

/**
 * @domain shared
 * @layer ui
 * @responsibility Custom/extended animated-theme-toggler component - Enhanced UI functionality
 * @owner afenda/shadcn
 * @dependencies
 * - shadcn/ui components
 * - @/lib/utils
 * @exports
 * - animated-theme-toggler component
 */

import * as React from "react"
import { flushSync } from "react-dom"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { buttonVariants } from "../button"

type Props = React.ComponentPropsWithoutRef<"button"> & {
  duration?: number
}

export function AnimatedThemeToggler({
  className,
  duration = 400,
  ...props
}: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch by waiting for client-side mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark"

  const toggleTheme = React.useCallback(async () => {
    if (!buttonRef.current) return

    const next = isDark ? "light" : "dark"

    // View Transition API (Chrome/Edge). Fall back gracefully elsewhere.
    const startViewTransition = (
      document as unknown as Document & {
        startViewTransition?: (callback: () => void) => { ready: Promise<void> }
      }
    ).startViewTransition

    if (!startViewTransition) {
      setTheme(next)
      return
    }

    try {
      // Important: keep correct `this` binding (otherwise "Illegal invocation").
      await startViewTransition.call(document, () => {
        flushSync(() => {
          setTheme(next)
        })
      }).ready
    } catch {
      // If View Transitions throws (or is blocked), fall back to plain toggle.
      setTheme(next)
      return
    }

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        // Not in TS DOM lib yet.
        pseudoElement: "::view-transition-new(root)",
      } as unknown as KeyframeAnimationOptions
    )
  }, [duration, isDark, setTheme])

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        className
      )}
      {...props}
    >
      {/* Prevent hydration mismatch: render neutral state until mounted */}
      {!mounted ? (
        <SunIcon className="opacity-0" />
      ) : isDark ? (
        <SunIcon />
      ) : (
        <MoonIcon />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

