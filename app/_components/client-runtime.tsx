"use client";

import type { ReactNode } from "react";

export interface ClientRuntimeProps {
  /** Optional children; component can be used as a sibling (no children) for side-effect only. */
  children?: ReactNode;
}

/**
 * Client-only runtime wrapper. Mount as sibling to run after hydration.
 * Use for: analytics init, service worker registration, error tracking.
 * Does not render UI when used without children.
 *
 * @layer app/components
 */
export function ClientRuntime({ children }: ClientRuntimeProps) {
  return children != null ? <>{children}</> : null;
}
