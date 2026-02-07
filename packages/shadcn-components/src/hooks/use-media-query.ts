/**
 * @domain shared
 * @layer ui
 * @responsibility Custom media query hook for responsive design
 * @owner afenda/shadcn
 * @exports
 * - useMediaQuery hook
 */

import * as React from "react"

/**
 * React hook for tracking CSS media query matches.
 * Useful for responsive design beyond the mobile breakpoint.
 *
 * @example
 * const isLargeScreen = useMediaQuery("(min-width: 1024px)")
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
 * const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handleChange = () => {
      setMatches(mediaQuery.matches)
    }
    
    // Set initial value
    handleChange()
    
    // Listen for changes
    mediaQuery.addEventListener("change", handleChange)
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches ?? false
}
