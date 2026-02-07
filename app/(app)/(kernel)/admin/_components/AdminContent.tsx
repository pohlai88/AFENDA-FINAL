"use client";

/**
 * Admin Content Wrapper
 * Client component that wraps admin content with auto-refresh.
 */

import * as React from "react";
import { AutoRefreshWrapper } from "../../dashboard/_components/AutoRefreshWrapper";

interface AdminContentProps {
  children: React.ReactNode;
}

export function AdminContent({ children }: AdminContentProps) {
  return (
    <AutoRefreshWrapper intervalMs={30000} enabled={true}>
      {children}
    </AutoRefreshWrapper>
  );
}
