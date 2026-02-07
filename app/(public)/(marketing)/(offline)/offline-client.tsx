/**
 * Offline page client component - minimal client boundary
 * Handles auto-refresh detection and manual reload button
 */
"use client"

import { useEffect } from "react"
import { Button } from "@afenda/shadcn"

export function OfflinePageClient() {
  useEffect(() => {
    /**
     * Listen for 'online' event to auto-refresh when connection is restored
     * This provides seamless UX without requiring user interaction
     */
    const handleOnline = () => {
      window.location.reload()
    }

    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  return (
    <Button
      onClick={() => window.location.reload()}
      className="w-full"
      size="lg"
    >
      Try Again
    </Button>
  )
}
