'use client'

/**
 * Global navigation progress bar component
 * Shows animated progress indicator during slow network transitions
 * Uses Framer Motion for smooth animations
 */

import { useEffect, useState } from 'react'
import { useTransition } from 'react'

export function NavProgressBar() {
  const [isPending] = useTransition()
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  // Show progress bar when transition starts
  useEffect(() => {
    if (isPending) {
      const startRaf = requestAnimationFrame(() => {
        setIsVisible(true)
        setProgress(10)
      })
      
      // Simulate progress increment
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90
          return prev + Math.random() * 30
        })
      }, 200)

      return () => {
        cancelAnimationFrame(startRaf)
        clearInterval(interval)
      }
    } else if (isVisible) {
      // Complete the progress bar
      const completeRaf = requestAnimationFrame(() => setProgress(100))
      const timeout = setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
      }, 300)
      return () => {
        cancelAnimationFrame(completeRaf)
        clearTimeout(timeout)
      }
    }
  }, [isPending, isVisible])

  if (!isVisible && progress === 0) {
    return null
  }

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 transition-all duration-300 z-50"
      style={{
        width: `${progress}%`,
        opacity: isVisible ? 1 : 0,
      }}
    />
  )
}
