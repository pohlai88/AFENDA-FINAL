"use client"

/**
 * @domain shared
 * @layer ui
 * @responsibility Custom/extended dot-pattern component - Enhanced UI functionality
 * @owner afenda/shadcn
 * @dependencies
 * - shadcn/ui components
 * - @/lib/utils
 * @exports
 * - dot-pattern component
 */

import * as React from "react"
import { motion } from "motion/react"

import { cn } from "../lib/utils"

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
  glow?: boolean
  [key: string]: unknown
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  const id = React.useId()
  const containerRef = React.useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  const seeded = React.useCallback((seed: number) => {
    // Deterministic pseudo-random in [0, 1).
    const x = Math.sin(seed) * 10_000
    return x - Math.floor(x)
  }, [])

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const cols = Math.ceil(dimensions.width / width)
  const rows = Math.ceil(dimensions.height / height)
  const dots = React.useMemo(() => {
    const length = cols * rows
    return Array.from({ length }, (_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      return {
        x: col * width + cx + x,
        y: row * height + cy + y,
        delay: seeded(i + 1) * 5,
        duration: seeded(i + 999) * 3 + 2,
      }
    })
  }, [cols, rows, width, height, cx, cy, x, y, seeded])

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-neutral-400/80",
        className
      )}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots.map((dot) => (
        <motion.circle
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          fill={glow ? `url(#${id}-gradient)` : "currentColor"}
          initial={glow ? { opacity: 0.4, scale: 1 } : undefined}
          animate={
            glow
              ? {
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.5, 1],
                }
              : undefined
          }
          transition={
            glow
              ? {
                  duration: dot.duration,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: dot.delay,
                  ease: "easeInOut",
                }
              : undefined
          }
        />
      ))}
    </svg>
  )
}

