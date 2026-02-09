/**
 * @domain shared
 * @layer ui
 * @responsibility Custom/extended bento-grid component - Enhanced UI functionality
 * @owner afenda/shadcn
 * @dependencies
 * - shadcn/ui components
 * - @/lib/utils
 * @exports
 * - bento-grid component
 */

import { ComponentPropsWithoutRef, ReactNode } from "react"
import { ArrowRightIcon } from "@radix-ui/react-icons"

import { cn } from "../lib/utils"
import { Button } from "../button"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface MetaChip {
  label: string
  value: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className?: string
  background?: ReactNode
  Icon: React.ElementType
  description: string
  href?: string
  cta?: string
  // New optional props for operator-grade UX
  eyebrow?: string
  bullets?: string[]
  meta?: MetaChip[]
  actions?: ReactNode
  variant?: "default" | "innovation" | "warning" | "lux"
}

const variantStyles: Record<string, string> = {
  default: "",
  innovation: "ring-1 ring-indigo-500/20 dark:ring-indigo-400/20",
  warning: "ring-1 ring-amber-500/30 dark:ring-amber-400/20",
  lux: "bg-gradient-to-br from-neutral-900 to-neutral-800 text-white dark:ring-0",
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[20rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  eyebrow,
  bullets,
  meta,
  actions,
  variant = "default",
  ...props
}: BentoCardProps) => {
  const variantClass = variantStyles[variant] || ""

  return (
    <div
      key={name}
      className={cn(
        "group relative col-span-3 lg:col-span-1 flex flex-col justify-between overflow-hidden rounded-xl",
        "bg-background shadow-(--card-shadow)",
        "dark:bg-background transform-gpu dark:shadow-(--card-shadow-dark) dark:[border:var(--card-border-dark)]",
        variantClass,
        className
      )}
      {...props}
    >
      {background && <div>{background}</div>}
      
      <div className="p-5 space-y-4">
        {/* Eyebrow / Category Label */}
        {eyebrow && (
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </div>
        )}

        {/* Header: Icon + Title + Description */}
        <div className="flex items-start gap-3">
          <Icon className="h-10 w-10 text-neutral-700 dark:text-neutral-300 transition group-hover:scale-90 shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">
              {description}
            </p>
          </div>
        </div>

        {/* Bullets - Scannable value points */}
        {bullets && bullets.length > 0 && (
          <ul className="text-sm text-muted-foreground space-y-1">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Meta Chips - Quick contextual info */}
        {meta && meta.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {meta.map((chip, idx) => (
              <span
                key={idx}
                className="rounded-md border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-muted-foreground"
              >
                {chip.label}: <strong>{chip.value}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Actions - Multi-button slot */}
        {actions ? (
          <div className="flex flex-wrap gap-2 pt-2">{actions}</div>
        ) : href && cta ? (
          <Button variant="link" asChild size="sm" className="p-0">
            <a href={href}>
              {cta}
              <ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
            </a>
          </Button>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/3 group-hover:dark:bg-neutral-800/10" />
    </div>
  )
}

export { BentoCard, BentoGrid }
