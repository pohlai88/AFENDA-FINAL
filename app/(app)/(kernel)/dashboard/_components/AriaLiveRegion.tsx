"use client";

/**
 * ARIA Live Region for Accessibility
 * Announces dynamic content updates to screen readers
 * 
 * @domain app
 * @layer component
 */

import * as React from "react";

interface AriaLiveRegionProps {
  /** Message to announce to screen readers */
  message: string;
  /** Politeness level: 'polite' (default) or 'assertive' for urgent updates */
  politeness?: "polite" | "assertive";
  /** Optional role override */
  role?: "status" | "alert" | "log";
}

/**
 * ARIA Live Region Component
 * 
 * Announces dynamic updates to screen readers without interrupting user flow.
 * Use 'polite' for non-urgent updates, 'assertive' for critical alerts.
 */
export function AriaLiveRegion({ 
  message, 
  politeness = "polite",
  role 
}: AriaLiveRegionProps) {
  return (
    <div
      role={role || (politeness === "assertive" ? "alert" : "status")}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Hook for managing ARIA announcements
 * 
 * Usage:
 * ```tsx
 * const announce = useAriaAnnounce();
 * announce("System health updated to 95%");
 * ```
 */
export function useAriaAnnounce() {
  const [announcement, setAnnouncement] = React.useState("");

  const announce = React.useCallback((message: string) => {
    // Clear first to ensure the screen reader picks up the change
    setAnnouncement("");
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  return { announce, announcement };
}

/**
 * ARIA Live Region Hook Component
 * Renders a live region that can be controlled via hook
 */
export function AriaLiveRegionHook({ 
  announcement,
  politeness = "polite" 
}: { 
  announcement: string;
  politeness?: "polite" | "assertive";
}) {
  if (!announcement) return null;
  
  return (
    <AriaLiveRegion 
      message={announcement} 
      politeness={politeness}
    />
  );
}
