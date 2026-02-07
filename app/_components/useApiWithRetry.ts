"use client";

/**
 * Fetch with retry and exponential backoff. Use for BFF/API calls from the UI.
 * Uses toast from sonner for user feedback (configurable).
 *
 * @layer app/components
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface ApiRetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  showToast?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export interface ApiWithRetryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  retryCount: number;
}

export function useApiWithRetry<T = unknown>() {
  const [state, setState] = useState<ApiWithRetryState<T>>({
    data: null,
    error: null,
    isLoading: false,
    retryCount: 0,
  });

  const execute = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      retryOptions: ApiRetryOptions = {}
    ): Promise<T | null> => {
      const {
        maxRetries = 3,
        initialDelay = 1000,
        showToast = true,
        onSuccess,
        onError,
      } = retryOptions;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      let attempt = 0;
      let delay = initialDelay;
      let lastError: Error | null = null;

      while (attempt <= maxRetries) {
        try {
          const response = await fetch(url, options);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          setState({
            data,
            error: null,
            isLoading: false,
            retryCount: attempt,
          });

          if (showToast && attempt > 0) {
            toast.success(`Request succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
          }

          onSuccess?.(data);
          return data;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          attempt++;

          if (attempt <= maxRetries) {
            if (showToast) {
              toast.loading(`Retrying... (${attempt}/${maxRetries})`, { duration: delay });
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, 10000); // Exponential backoff, max 10s
          }
        }
      }

      // All retries exhausted
      setState({
        data: null,
        error: lastError,
        isLoading: false,
        retryCount: maxRetries,
      });

      if (showToast && lastError) {
        toast.error(`Request failed after ${maxRetries} retries: ${lastError.message}`);
      }

      onError?.(lastError!);
      return null;
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      retryCount: 0,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
