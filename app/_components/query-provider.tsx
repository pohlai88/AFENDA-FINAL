"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export interface QueryProviderProps {
  children: ReactNode;
}

const STALE_TIME_MS = 60 * 1000; // 1 minute

/**
 * React Query provider. Wrap the app tree so useQuery, useMutation, useQueryClient work.
 * Uses a stable QueryClient instance (created once per mount).
 *
 * @layer app/components
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME_MS,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
