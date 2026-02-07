"use client"

/**
 * StatCard Component
 * Shadcn-compliant stat card with animated numbers
 * 
 * @domain admin
 * @layer component
 */

import { Card, CardContent } from "@afenda/shadcn"
import { NumberTicker } from "@afenda/shadcn/custom"
import { cn } from "@afenda/shadcn/lib"

interface StatCardProps {
  value: number
  label: string
  variant?: "default" | "primary" | "secondary" | "accent"
  className?: string
}

export function StatCard({ 
  value, 
  label, 
  variant = "default",
  className 
}: StatCardProps) {
  return (
    <Card className={cn(
      "border-0 shadow-sm transition-colors",
      variant === "primary" && "bg-primary/5",
      variant === "secondary" && "bg-secondary/5",
      variant === "accent" && "bg-accent/5",
      className
    )}>
      <CardContent className="p-4">
        <NumberTicker 
          value={value}
          className={cn(
            "text-2xl font-bold tabular-nums block",
            variant === "primary" && "text-primary",
            variant === "secondary" && "text-secondary-foreground",
            variant === "accent" && "text-accent-foreground"
          )}
          direction="up"
          delay={0.1}
        />
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  )
}
