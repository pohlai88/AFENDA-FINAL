/**
 * Service Registry Content Wrapper
 * Provides auto-refresh with Suspense boundary for service registry
 */

import { Suspense } from "react";
import { AutoRefreshWrapper } from "../../../dashboard/_components/AutoRefreshWrapper";
import { ServiceRegistrySkeleton } from "./ServiceRegistrySkeleton";

interface ServiceRegistryContentProps {
  children: React.ReactNode;
}

export function ServiceRegistryContent({ children }: ServiceRegistryContentProps) {
  return (
    <AutoRefreshWrapper intervalMs={30000}>
      <Suspense fallback={<ServiceRegistrySkeleton />}>
        {children}
      </Suspense>
    </AutoRefreshWrapper>
  );
}
