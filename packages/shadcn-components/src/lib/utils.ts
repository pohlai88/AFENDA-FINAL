/**
 * @domain shared
 * @layer ui
 * @responsibility Core utility functions for shadcn/ui components
 * @owner afenda/shadcn
 * @dependencies
 * - clsx
 * - tailwind-merge
 * @exports
 * - cn() - className merger utility
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes with proper precedence.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 * 
 * @param inputs - Class values to merge (strings, arrays, objects, etc.)
 * @returns Merged className string with proper Tailwind precedence
 * 
 * @example
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-blue-500", className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
