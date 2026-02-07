"use client";

/**
 * Retry with exponential backoff. Use for unstable async work (e.g. network).
 *
 * @layer app/components
 */

import { useState, useCallback, useRef } from "react";

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const executeWithRetry = useCallback(async (): Promise<T> => {
    let attempt = 0;
    let delay = initialDelay;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      try {
        setState((prev) => ({
          ...prev,
          isRetrying: attempt > 0,
          retryCount: attempt,
        }));

        const result = await fnRef.current();

        setState({
          isRetrying: false,
          retryCount: 0,
          lastError: null,
        });

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        setState((prev) => ({ ...prev, lastError: err }));

        if (attempt >= maxRetries) {
          setState((prev) => ({ ...prev, isRetrying: false }));
          throw err;
        }

        onRetry?.(attempt + 1, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
        attempt++;
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }, [maxRetries, initialDelay, maxDelay, backoffMultiplier, onRetry]);

  const reset = useCallback(() => {
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
    });
  }, []);

  return {
    execute: executeWithRetry,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    lastError: state.lastError,
    reset,
  };
}

/**
 * Retry a function with exponential backoff (one-time use).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let attempt = 0;
  let delay = initialDelay;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= maxRetries) {
        throw lastError;
      }

      onRetry?.(attempt + 1, lastError);

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
      attempt++;
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
