import { createJSONStorage, type PersistOptions, type PersistStorage } from "zustand/middleware";

/**
 * Persistence Utilities
 * Following official Zustand persist middleware:
 * @see https://zustand.docs.pmnd.rs/integrations/persisting-store-data
 * @see https://zustand.docs.pmnd.rs/middlewares/persist
 * 
 * Key principles:
 * - Use createJSONStorage for standard storage
 * - partialize to persist only needed state
 * - version + migrate for schema changes
 * - skipHydration for SSR apps
 */

/**
 * Create persist options with common defaults.
 * 
 * @example
 * ```ts
 * const useBearStore = create<BearStore>()(
 *   persist(
 *     (set) => ({ bears: 0, addBear: () => set((s) => ({ bears: s.bears + 1 })) }),
 *     createPersistConfig({
 *       name: 'bear-storage',
 *       version: 1,
 *       partialize: (s) => ({ bears: s.bears }), // Only persist bears count
 *     })
 *   )
 * )
 * ```
 */
export function createPersistConfig<TState, TPersistedState = TState>(
  options: {
    /** Unique storage key name */
    name: string;
    /** Schema version for migrations */
    version?: number;
    /** Select which state to persist */
    partialize?: (state: TState) => TPersistedState;
    /** Migration function for version upgrades */
    migrate?: (persistedState: unknown, version: number) => TPersistedState | Promise<TPersistedState>;
    /** Custom storage (defaults to localStorage) */
    storage?: PersistStorage<TPersistedState>;
    /** Skip initial hydration (useful for SSR) */
    skipHydration?: boolean;
    /** Callback before rehydration */
    onRehydrateStorage?: (state: TState) => ((state?: TState, error?: unknown) => void) | void;
    /** Merge persisted state with current state */
    merge?: (persistedState: unknown, currentState: TState) => TState;
  }
): PersistOptions<TState, TPersistedState> {
  return {
    name: options.name,
    version: options.version ?? 0,
    partialize: options.partialize as PersistOptions<TState, TPersistedState>["partialize"],
    migrate: options.migrate,
    storage: options.storage ?? (createJSONStorage(() => localStorage) as PersistStorage<TPersistedState>),
    skipHydration: options.skipHydration,
    onRehydrateStorage: options.onRehydrateStorage,
    merge: options.merge,
  };
}

/**
 * Create sessionStorage-backed persist config.
 * Use for state that should reset when the browser tab closes.
 * 
 * @example
 * ```ts
 * const useSessionStore = create<SessionStore>()(
 *   persist(
 *     (set) => ({ token: null }),
 *     createSessionPersistConfig({ name: 'session' })
 *   )
 * )
 * ```
 */
export function createSessionPersistConfig<TState, TPersistedState = TState>(
  options: Omit<Parameters<typeof createPersistConfig<TState, TPersistedState>>[0], "storage">
): PersistOptions<TState, TPersistedState> {
  return createPersistConfig({
    ...options,
    storage: createJSONStorage(() => sessionStorage) as PersistStorage<TPersistedState>,
  });
}

/**
 * Create a versioned persist key.
 * Useful for manual storage operations.
 */
export function createPersistKey(namespace: string, version: number = 0): string {
  return `${namespace}:v${version}`;
}

/**
 * Clear persisted state for a store.
 * Useful for logout or reset functionality.
 */
export function clearPersistedState(name: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(name);
  }
}

/**
 * Get persisted state without hydrating store.
 * Useful for SSR or debugging.
 */
export function getPersistedState<TState>(name: string): TState | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  const item = window.localStorage.getItem(name);
  if (!item) return null;

  try {
    const parsed = JSON.parse(item) as { state: TState; version?: number };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

/**
 * Create a simple merge migration.
 * Merges persisted state with new defaults when adding fields.
 * 
 * @example
 * ```ts
 * const useBearStore = create<BearStore>()(
 *   persist(
 *     (set) => ({ bears: 0, honey: 0 }),
 *     {
 *       name: 'bear-storage',
 *       version: 2,
 *       migrate: createMergeMigration({ bears: 0, honey: 0 }),
 *     }
 *   )
 * )
 * ```
 */
export function createMergeMigration<TState extends object>(
  defaults: TState
): (persistedState: unknown, version: number) => TState {
  return (persistedState: unknown): TState => {
    if (typeof persistedState !== "object" || persistedState === null) {
      return defaults;
    }
    return { ...defaults, ...persistedState } as TState;
  };
}

/**
 * Create a versioned migration handler.
 * Runs specific migrations based on version number.
 * 
 * @example
 * ```ts
 * const migrate = createVersionedMigration({
 *   1: (state) => ({ ...state, newField: 'default' }),
 *   2: (state) => ({ ...state, renamedField: state.oldField }),
 * }, { /* current defaults *\/ })
 * ```
 */
export function createVersionedMigration<TState extends object>(
  migrations: Record<number, (state: Record<string, unknown>) => Partial<TState>>,
  currentDefaults: TState
): (persistedState: unknown, version: number) => TState {
  return (persistedState: unknown, version: number): TState => {
    if (typeof persistedState !== "object" || persistedState === null) {
      return currentDefaults;
    }

    let state = persistedState as Record<string, unknown>;

    // Apply migrations in order
    const sortedVersions = Object.keys(migrations)
      .map(Number)
      .filter((v) => v > version)
      .sort((a, b) => a - b);

    for (const v of sortedVersions) {
      state = { ...state, ...migrations[v](state) };
    }

    // Merge with current defaults to ensure all fields exist
    return { ...currentDefaults, ...state } as TState;
  };
}
