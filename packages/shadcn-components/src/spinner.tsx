/**
 * @domain shared
 * @layer ui
 * @responsibility shadcn/ui spinner component - UI building block
 * @owner afenda/shadcn
 * @dependencies
 * - radix-ui (external)
 * - @/lib/utils
 * @exports
 * - spinner component and related subcomponents
 */

import { Loader2Icon } from "lucide-react"

import { cn } from "./lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
