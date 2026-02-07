/**
 * @domain shared
 * @layer ui
 * @responsibility Local storage hook for persistent state
 * @owner afenda/shadcn
 * @exports
 * - useLocalStorage hook
 */

import * as React from "react"

/**
 * React hook for syncing state with localStorage.
 * Provides persistence across page refreshes and browser sessions.
 * SSR-safe: returns initialValue during server rendering.
 *
 * @example
 * const [theme, setTheme] = useLocalStorage("theme", "light")
 * const [settings, setSettings] = useLocalStorage("app-settings", { notifications: true })
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Listen for changes to the key in other tabs/windows
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T)
        } catch (error) {
          console.warn(`Error parsing localStorage key "${key}":`, error)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [key])

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}
