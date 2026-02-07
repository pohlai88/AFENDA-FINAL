/**
 * @domain shared
 * @layer ui
 * @responsibility Mobile detection hook for responsive behavior
 * @owner afenda/shadcn
 * @exports
 * - useIsMobile hook
 * - MOBILE_BREAKPOINT constant
 */

import * as React from "react"

/** Mobile breakpoint in pixels (default: 768px) */
export const MOBILE_BREAKPOINT = 768

/**
 * React hook for detecting mobile viewport.
 * Uses matchMedia for efficient, event-driven updates.
 * SSR-safe: returns false during server rendering.
 *
 * @example
 * const isMobile = useIsMobile()
 *
 * return isMobile ? <MobileNav /> : <DesktopNav />
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
