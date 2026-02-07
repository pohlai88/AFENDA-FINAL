"use client"

import { useEffect, useRef } from "react"
import { routes } from "@/lib/routes"

interface UseTokenRefreshOptions {
  /**
   * Interval to check token expiration (in milliseconds)
   * Default: 60 seconds
   */
  checkIntervalMs?: number

  /**
   * Callback when token refresh is attempted
   */
  onRefresh?: (success: boolean) => void

  /**
   * Callback when token refresh fails
   */
  onRefreshError?: (error: Error) => void
}

/**
 * useTokenRefresh - Client-side hook for automatic token refresh
/**
 * Hook for automatic JWT token refresh via polling
 * 
 * Periodically checks Neon Auth token expiration and triggers refresh
 * when remaining lifetime falls below 10 minutes.
 * 
 * @param options Configuration for token refresh behavior
 * 
 * @example
 * function Layout() {
 *   useTokenRefresh({
 *     checkIntervalMs: 60000,
 *     onRefresh: (success) => {
 *       if (success) console.log("Token refreshed")
 *     },
 *   })
 *   
 *   return <div>App content</div>
 * }
 */
export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const {
    checkIntervalMs = 60 * 1000, // Check every 60 seconds
    onRefresh,
    onRefreshError,
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasRefreshedRef = useRef(false)

  useEffect(() => {
    // Start periodic token refresh check
    intervalRef.current = setInterval(async () => {
      try {
        // Call server endpoint to check and refresh token
        const response = await fetch(routes.api.auth.refresh(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.refreshed) {
          hasRefreshedRef.current = true
          onRefresh?.(true)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        onRefreshError?.(err)
      }
    }, checkIntervalMs)

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkIntervalMs, onRefresh, onRefreshError])

  return {
    /**
     * Manually trigger token refresh
     */
    refreshNow: async () => {
      try {
        const response = await fetch(routes.api.auth.refresh(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        onRefreshError?.(error instanceof Error ? error : new Error(String(error)))
        throw error
      }
    },

    /**
     * Check if token has been refreshed during this session
     */
    hasRefreshed: hasRefreshedRef.current,
  }
}
