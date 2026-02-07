"use client"

/**
 * @domain shared
 * @layer ui
 * @responsibility shadcn/ui aspect-ratio component - UI building block
 * @owner afenda/shadcn
 * @dependencies
 * - radix-ui (external)
 * - @/lib/utils
 * @exports
 * - aspect-ratio component and related subcomponents
 */

import { AspectRatio as AspectRatioPrimitive } from "radix-ui"

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
