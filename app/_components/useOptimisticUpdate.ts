"use client";

/**
 * Optimistic update: show UI immediately, then confirm or rollback.
 * Uses router.refresh() and toast from sonner. Use for mutations that support revalidation.
 *
 * @layer app/components
 */

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  revalidate?: boolean;
}

interface OptimisticState<T> {
  data: T | null;
  isOptimistic: boolean;
  error: Error | null;
}

export function useOptimisticUpdate<T, TArgs extends unknown[]>(
  initialData: T | null = null
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    error: null,
  });

  const execute = useCallback(
    async (
      optimisticData: T,
      asyncFn: () => Promise<T>,
      options: OptimisticUpdateOptions<T> = {}
    ) => {
      const {
        onSuccess,
        onError,
        successMessage,
        errorMessage,
        revalidate = true,
      } = options;

      // Store previous state for rollback
      const previousState = state.data;

      // Immediately update UI with optimistic data
      setState({
        data: optimisticData,
        isOptimistic: true,
        error: null,
      });

      try {
        const result = await asyncFn();

        // Update with real data
        setState({
          data: result,
          isOptimistic: false,
          error: null,
        });

        // Show success message
        if (successMessage) {
          toast.success(successMessage);
        }

        // Revalidate if needed
        if (revalidate) {
          startTransition(() => {
            router.refresh();
          });
        }

        // Call success callback
        onSuccess?.(result);

        return { success: true, data: result };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Rollback to previous state
        setState({
          data: previousState,
          isOptimistic: false,
          error: err,
        });

        // Show error message
        if (errorMessage) {
          toast.error(errorMessage);
        } else {
          toast.error(err.message || "Operation failed");
        }

        // Call error callback
        onError?.(err);

        return { success: false, error: err };
      }
    },
    [state.data, router]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isOptimistic: false,
      error: null,
    });
  }, [initialData]);

  return {
    data: state.data,
    isOptimistic: state.isOptimistic,
    isPending,
    error: state.error,
    execute,
    reset,
  };
}

/**
 * Simplified optimistic update for single operations.
 */
export async function optimisticUpdate<T>(
  optimisticData: T,
  asyncFn: () => Promise<T>,
  options: {
    onRollback?: (previousData: T) => void;
    successMessage?: string;
    errorMessage?: string;
  } = {}
): Promise<{ success: boolean; data?: T; error?: Error }> {
  const { onRollback, successMessage, errorMessage } = options;

  try {
    // Execute the async operation
    const result = await asyncFn();

    // Show success message
    if (successMessage) {
      toast.success(successMessage);
    }

    return { success: true, data: result };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Rollback
    onRollback?.(optimisticData);

    // Show error message
    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      toast.error(err.message || "Operation failed");
    }

    return { success: false, error: err };
  }
}
