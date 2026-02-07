"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export interface ClientRuntimeProps {
  /** Optional children; component can be used as a sibling (no children) for side-effect only. */
  children?: ReactNode;
}

/** Dev-only: suppress known React DevTools instrumentation errors (RSC + streaming). */
const REACT_DEVTOOLS_IGNORE_PATTERNS = [
  "We are cleaning up async info that was not on the parent Suspense boundary",
  "There should always be an Offscreen Fiber child in a hydrated Suspense boundary",
  "React instrumentation encountered an error",
];

/**
 * Client-only runtime wrapper. Mount as sibling to run after hydration.
 * Use for: analytics init, service worker registration, error tracking.
 * In dev, filters console.error for known React DevTools/RSC instrumentation noise.
 *
 * @layer app/components
 */
export function ClientRuntime({ children }: ClientRuntimeProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const original = console.error;
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === "string" ? args[0] : String(args[0]);
      if (
        REACT_DEVTOOLS_IGNORE_PATTERNS.some((p) =>
          msg.includes(p)
        )
      ) {
        return;
      }
      original.apply(console, args);
    };
    return () => {
      console.error = original;
    };
  }, []);

  return children != null ? <>{children}</> : null;
}
