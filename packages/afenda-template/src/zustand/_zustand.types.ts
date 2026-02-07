import type { StateCreator, StoreApi, StoreMutatorIdentifier } from "zustand";

/**
 * Zustand Type Utilities
 * Following official Zustand TypeScript best practices:
 * @see https://zustand.docs.pmnd.rs/guides/advanced-typescript
 */

/**
 * Extract state type from a store.
 * @see zustand/vanilla ExtractState
 */
export type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

/**
 * StateCreator for slices pattern.
 * This is the official pattern from Zustand docs.
 * 
 * @template TState - The complete store state (all slices combined)
 * @template TSlice - The slice this creator produces
 * @template Mps - Middleware mutators applied before this slice
 * 
 * @example
 * ```ts
 * interface BearSlice {
 *   bears: number
 *   addBear: () => void
 * }
 * 
 * const createBearSlice: SliceCreator<BoundStore, BearSlice> = (set) => ({
 *   bears: 0,
 *   addBear: () => set((s) => ({ bears: s.bears + 1 })),
 * })
 * ```
 */
export type SliceCreator<
  TState,
  TSlice,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
> = StateCreator<TState, Mps, Mcs, TSlice>;

/**
 * Common middleware mutator types.
 * Use these when defining slices with middleware.
 * 
 * @example
 * ```ts
 * const createSlice: StateCreator<
 *   MyStore,
 *   [["zustand/devtools", never]],
 *   [],
 *   MySlice
 * > = (set) => ({ ... })
 * ```
 */
export type DevtoolsMutator = ["zustand/devtools", never];
export type PersistMutator<T> = ["zustand/persist", T];
export type ImmerMutator = ["zustand/immer", never];
export type SubscribeWithSelectorMutator = ["zustand/subscribeWithSelector", never];

/**
 * Selector function type.
 */
export type Selector<TState, TResult> = (state: TState) => TResult;

/**
 * Store subscription callback.
 */
export type StoreListener<TState> = (state: TState, prevState: TState) => void;

/**
 * Type for creating bounded useStore hooks.
 * @see https://zustand.docs.pmnd.rs/guides/advanced-typescript#bounded-usestore-hook-for-vanilla-stores
 */
export type BoundedUseStore<S extends StoreApi<unknown>> = {
  (): ExtractState<S>;
  <U>(selector: (state: ExtractState<S>) => U): U;
};

/**
 * Helper type for store with actions pattern.
 * Separates state from actions for clarity.
 */
export type StoreWithActions<TState, TActions> = TState & TActions;
