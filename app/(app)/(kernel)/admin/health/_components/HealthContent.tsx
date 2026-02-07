"use client";

/**
 * Health Content Wrapper
 * Client component that wraps health content with auto-refresh.
 */

import * as React from "react";
import { AutoRefreshWrapper } from "../../../dashboard/_components/AutoRefreshWrapper";

interface HealthContentProps {
  children: React.ReactNode;
}

export function HealthContent({ children }: HealthContentProps) {
  return (
    <AutoRefreshWrapper intervalMs={30000} enabled={true}>
      {children}
    </AutoRefreshWrapper>
  );
}
