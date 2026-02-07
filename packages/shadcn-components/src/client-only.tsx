"use client";

/**
 * @domain shared
 * @layer ui
 * @responsibility Client-only rendering wrapper to prevent Radix UI SSR hydration mismatches
 * @owner afenda/shadcn
 *
 * Problem: Radix UI components (Sheet, Dialog, Tooltip, Popover, DropdownMenu, etc.)
 * generate runtime IDs for aria-controls/aria-labelledby that differ between
 * server and client, causing React hydration mismatches.
 *
 * Solution: This component renders children only on the client, preventing the
 * server from generating IDs that won't match the client-generated ones.
 *
 * @example
 * // Option 1: Wrap directly
 * <ClientOnly fallback={<Button>Menu</Button>}>
 *   <Sheet>...</Sheet>
 * </ClientOnly>
 *
 * // Option 2: Use with dynamic import (recommended for larger components)
 * const MobileMenu = dynamic(() => import("./mobile-menu"), { ssr: false });
 *
 * @exports
 * - ClientOnly: Wrapper component for client-only rendering
 * - withClientOnly: HOC for client-only components
 */

import * as React from "react";
import { useState, useEffect, type ReactNode } from "react";

export interface ClientOnlyProps {
  /**
   * Content to render only on the client
   */
  children: ReactNode;
  /**
   * Fallback content to render during SSR and initial hydration.
   * Should match the approximate size/shape of children to prevent layout shift.
   */
  fallback?: ReactNode;
}

/**
 * Renders children only on the client to prevent SSR hydration mismatches.
 * Use for Radix UI components that generate runtime IDs (Sheet, Dialog, etc.)
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Standard SSR hydration pattern
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * HOC to wrap a component for client-only rendering.
 * Useful when you need to export a client-only version of an existing component.
 *
 * @example
 * export const ClientOnlySheet = withClientOnly(Sheet);
 */
export function withClientOnly<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  function WrappedComponent(props: P) {
    return (
      <ClientOnly fallback={fallback}>
        <Component {...props} />
      </ClientOnly>
    );
  }

  WrappedComponent.displayName = `ClientOnly(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
}
