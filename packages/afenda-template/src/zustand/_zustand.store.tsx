"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createStore as createVanillaStore } from "zustand/vanilla";
import type { StoreApi } from "zustand";
import type { ExtractState, BoundedUseStore } from "./_zustand.types";

/**
 * Next.js compatible store utilities.
 * Following official Zustand Next.js guide:
 * @see https://zustand.docs.pmnd.rs/guides/nextjs
 * 
 * Key principles:
 * - No global stores (create per request)
 * - RSCs should not read/write stores
 * - Use Context for client-side state
 */

/**
 * Create a store provider and hook for Next.js App Router.
 * This pattern ensures per-request stores on the server and
 * proper hydration on the client.
 * 
 * @example
 * ```ts
 * // 1. Define your store types
 * type CounterState = { count: number }
 * type CounterActions = { increment: () => void }
 * type CounterStore = CounterState & CounterActions
 * 
 * // 2. Create your store factory
 * const createCounterStore = (init: CounterState = { count: 0 }) =>
 *   createVanillaStore<CounterStore>()((set) => ({
 *     ...init,
 *     increment: () => set((s) => ({ count: s.count + 1 })),
 *   }))
 * 
 * // 3. Create provider and hook
 * const {
 *   Provider: CounterProvider,
 *   useStore: useCounterStore,
 * } = createStoreContext(createCounterStore)
 * 
 * // 4. Use in layout
 * export default function Layout({ children }) {
 *   return <CounterProvider>{children}</CounterProvider>
 * }
 * 
 * // 5. Use in client components
 * 'use client'
 * const count = useCounterStore((s) => s.count)
 * ```
 */
export function createStoreContext<
  TState,
  TInitialState = Partial<TState>
>(
  createStoreFn: (initialState?: TInitialState) => StoreApi<TState>
) {
  type Store = ReturnType<typeof createStoreFn>;

  const Context = createContext<Store | null>(null);

  function Provider({
    children,
    initialState,
  }: {
    children: ReactNode;
    initialState?: TInitialState;
  }) {
    // useState ensures store is created once per component instance
    // This is critical for SSR - each request gets its own store
    const [store] = useState(() => createStoreFn(initialState));

    return <Context.Provider value={store}>{children}</Context.Provider>;
  }

  function useStoreHook(): TState;
  function useStoreHook<U>(selector: (state: TState) => U): U;
  function useStoreHook<U>(selector?: (state: TState) => U) {
    const store = useContext(Context);
    if (!store) {
      throw new Error(
        "Store not found. Wrap your component with the Provider."
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return useStore(store, selector as any);
  }

  return {
    Provider,
    useStore: useStoreHook,
    Context,
  };
}

/**
 * Create a bounded useStore hook for vanilla stores.
 * Use this when you need direct store access (e.g., outside React).
 * 
 * @example
 * ```ts
 * const counterStore = createVanillaStore<CounterStore>()((set) => ({
 *   count: 0,
 *   increment: () => set((s) => ({ count: s.count + 1 })),
 * }))
 * 
 * const useCounterStore = createBoundedUseStore(counterStore)
 * 
 * // In component:
 * const count = useCounterStore((s) => s.count)
 * ```
 */
export function createBoundedUseStore<S extends StoreApi<unknown>>(
  store: S
): BoundedUseStore<S> {
  return ((selector?: (state: ExtractState<S>) => unknown) =>
    useStore(store, selector!)) as BoundedUseStore<S>;
}

/**
 * Type for store factory function.
 * Useful for typing createCounterStore-style functions.
 */
export type StoreFactory<TState, TInit = Partial<TState>> = (
  initialState?: TInit
) => StoreApi<TState>;

// Re-export createStore from vanilla for convenience
export { createVanillaStore };
