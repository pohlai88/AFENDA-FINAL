import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Marketing domain class name utility.
 * Merges Tailwind classes with clsx support.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
