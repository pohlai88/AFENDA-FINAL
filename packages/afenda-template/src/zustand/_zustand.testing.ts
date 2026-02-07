import type { StoreApi, UseBoundStore } from "zustand";

/**
 * Testing Utilities for Zustand Stores
 * Following official Zustand testing guide:
 * @see https://zustand.docs.pmnd.rs/guides/testing
 * 
 * Key principles:
 * - Use getState() to inspect state
 * - Use setState() to set up test state
 * - Mock stores for isolated component tests
 * - Reset stores between tests
 */

/**
 * Get the current state of a store.
 */
export function getStoreState<TState>(
  store: UseBoundStore<StoreApi<TState>> | StoreApi<TState>
): TState {
  return store.getState();
}

/**
 * Set the state of a store directly.
 * Useful for test setup.
 */
export function setStoreState<TState>(
  store: UseBoundStore<StoreApi<TState>> | StoreApi<TState>,
  state: Partial<TState>
): void {
  store.setState(state);
}

/**
 * Reset a store to its initial state.
 * Works if the store has a reset action.
 */
export function resetStore<TState extends { reset?: () => void }>(
  store: UseBoundStore<StoreApi<TState>> | StoreApi<TState>
): void {
  const state = store.getState();
  if (typeof state.reset === "function") {
    state.reset();
  }
}

/**
 * Subscribe to store changes for testing side effects.
 */
export function subscribeToStore<TState>(
  store: UseBoundStore<StoreApi<TState>> | StoreApi<TState>,
  callback: (state: TState, prevState: TState) => void
): () => void {
  return store.subscribe(callback);
}

/**
 * Wait for a condition to be true in the store.
 * Useful for async testing.
 * 
 * @example
 * ```ts
 * await waitForCondition(store, (s) => s.isLoading === false)
 * expect(store.getState().data).toBeDefined()
 * ```
 */
export function waitForCondition<TState>(
  store: UseBoundStore<StoreApi<TState>> | StoreApi<TState>,
  predicate: (state: TState) => boolean,
  timeout = 5000
): Promise<TState> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Store condition timeout after ${timeout}ms`));
    }, timeout);

    // Check immediately
    const currentState = store.getState();
    if (predicate(currentState)) {
      clearTimeout(timer);
      resolve(currentState);
      return;
    }

    // Subscribe to changes
    const unsubscribe = store.subscribe((state: TState) => {
      if (predicate(state)) {
        clearTimeout(timer);
        unsubscribe();
        resolve(state);
      }
    });
  });
}

/**
 * Create a mock store for testing.
 * Provides basic getState, setState, subscribe functionality.
 * 
 * @example
 * ```ts
 * const mockStore = createMockStore({ count: 0, increment: vi.fn() })
 * render(<Counter store={mockStore} />)
 * ```
 */
export function createMockStore<TState extends object>(
  initialState: TState
): StoreApi<TState> {
  type Listener = (state: TState, prevState: TState) => void;
  const listeners = new Set<Listener>();
  let state = initialState;
  const initialStateCopy = { ...initialState };

  const getState = (): TState => state;
  const getInitialState = (): TState => initialStateCopy;

  const setState = (
    partial: Partial<TState> | ((state: TState) => Partial<TState>),
    replace?: boolean
  ): void => {
    const prevState = state;
    const updates = typeof partial === "function" ? partial(state) : partial;
    state = replace ? (updates as TState) : { ...state, ...updates };
    listeners.forEach((listener) => listener(state, prevState));
  };

  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const destroy = (): void => {
    listeners.clear();
  };

  return {
    getState,
    getInitialState,
    setState,
    subscribe,
    destroy,
  } as StoreApi<TState>;
}

/**
 * Spy on store actions for testing.
 * Records all calls and optionally mocks the implementation.
 * 
 * @example
 * ```ts
 * const spy = spyOnAction(store, 'increment')
 * store.getState().increment()
 * expect(spy.calls).toHaveLength(1)
 * spy.restore()
 * ```
 */
export function spyOnAction<
  TState extends object,
  K extends keyof TState
>(
  store: UseBoundStore<StoreApi<TState>> | StoreApi<TState>,
  actionName: K,
  mockFn?: TState[K]
): {
  calls: unknown[][];
  restore: () => void;
} {
  const state = store.getState();
  const original = state[actionName];

  if (typeof original !== "function") {
    throw new Error(`${String(actionName)} is not a function`);
  }

  const calls: unknown[][] = [];

  const spy = (...args: unknown[]): unknown => {
    calls.push(args);
    if (mockFn !== undefined) {
      return typeof mockFn === "function" ? mockFn(...args) : mockFn;
    }
    return (original as (...a: unknown[]) => unknown)(...args);
  };

  store.setState({ [actionName]: spy } as Partial<TState>);

  return {
    calls,
    restore: () => {
      store.setState({ [actionName]: original } as Partial<TState>);
    },
  };
}

/**
 * Create a store resetter for test cleanup.
 * Call this in beforeEach or afterEach.
 * 
 * @example
 * ```ts
 * const resetStores = createStoreResetter([useCounterStore, useBearStore])
 * afterEach(() => resetStores())
 * ```
 */
export function createStoreResetter(
  stores: Array<UseBoundStore<StoreApi<{ reset?: () => void }>> | StoreApi<{ reset?: () => void }>>
): () => void {
  return () => {
    stores.forEach((store) => {
      const state = store.getState();
      if (typeof state.reset === "function") {
        state.reset();
      }
    });
  };
}
