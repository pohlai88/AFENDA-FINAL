/**
 * @domain shared
 * @layer ui
 * @responsibility Debounce hook for delaying value changes
 * @owner afenda/shadcn
 * @exports
 * - useDebounce hook
 * - useDebouncedCallback hook
 */

import * as React from "react"

/**
 * React hook that debounces a value.
 * Useful for search inputs to avoid excessive API calls.
 *
 * @example
 * const [search, setSearch] = useState("")
 * const debouncedSearch = useDebounce(search, 300)
 *
 * useEffect(() => {
 *   // This runs 300ms after the user stops typing
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * React hook that returns a debounced callback function.
 * Useful when you need to debounce an event handler directly.
 *
 * @example
 * const handleSearch = useDebouncedCallback((value: string) => {
 *   fetchResults(value)
 * }, 300)
 *
 * return <input onChange={(e) => handleSearch(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedCallback = React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}
